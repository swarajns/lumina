'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AcceptInvitePage() {
  const [loading, setLoading] = useState(false)
  const [inviteData, setInviteData] = useState(null)
  const [debugInfo, setDebugInfo] = useState({})
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '', // ✅ Added confirm password
    full_name: ''
  })
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      fetchInviteDetails()
    } else {
      console.error('❌ No token provided in URL')
      toast.error('No invitation token provided')
    }
  }, [token])

  const fetchInviteDetails = async () => {
    try {
      console.log('🔍 Starting invite lookup...')
      console.log('📋 Token from URL:', token)
      console.log('🕐 Current timestamp:', new Date().toISOString())

      // First, check if the invitation exists at all (without status filter)
      const { data: allInvites, error: allError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invite_token', token)

      console.log('📊 All invitations with this token:', allInvites)
      console.log('❓ Query error (if any):', allError)

      if (allError) {
        console.error('❌ Database query error:', allError)
        toast.error('Database error: ' + allError.message)
        return
      }

      if (!allInvites || allInvites.length === 0) {
        console.error('❌ No invitation found with token:', token)
        toast.error('No invitation found with this token')
        toast.info('Please check if the invitation link is complete and correct')
        router.push('/login')
        return
      }

      const invite = allInvites[0]
      console.log('🎯 Found invitation:', invite)

      // Check invitation status
      if (invite.status !== 'pending') {
        console.error('❌ Invitation status is not pending:', invite.status)
        toast.error(`This invitation has already been ${invite.status}`)
        if (invite.status === 'accepted') {
          toast.info('You may already have an account. Try logging in instead.')
          router.push('/login')
        }
        return
      }

      // Check if invitation is expired
      const expiresAt = new Date(invite.expires_at)
      const now = new Date()
      const isExpired = expiresAt < now
      
      console.log('📅 Invitation expires at:', invite.expires_at)
      console.log('🕐 Current time:', now.toISOString())
      console.log('⏰ Is expired?', isExpired)
      console.log('⏰ Time remaining:', isExpired ? 'EXPIRED' : Math.round((expiresAt - now) / (1000 * 60 * 60)) + ' hours')

      if (isExpired) {
        console.error('❌ Invitation has expired')
        toast.error('This invitation has expired')
        toast.info('Please request a new invitation from your team admin')
        router.push('/login')
        return
      }

      // ✅ Updated: Fetch workspace info with correct table structure
      const { data: inviteWithWorkspace, error: workspaceError } = await supabase
        .from('user_invitations')
        .select(`
          *,
          workspaces(id, name, subscription_plan)
        `)
        .eq('invite_token', token)
        .eq('status', 'pending')
        .single()

      if (workspaceError) {
        console.warn('⚠️ Could not fetch workspace info, using basic invite data:', workspaceError)
        setInviteData(invite)
      } else {
        console.log('✅ Successfully fetched invitation with workspace info:', inviteWithWorkspace)
        setInviteData(inviteWithWorkspace)
      }

      // Set debug info for display
      setDebugInfo({
        token,
        inviteFound: true,
        status: invite.status,
        expiresAt: invite.expires_at,
        isExpired,
        email: invite.email,
        role: invite.role,
        workspaceId: invite.workspace_id,
        createdAt: invite.created_at
      })

      setFormData(prev => ({ ...prev, email: invite.email }))
      console.log('✅ Invitation loaded successfully')

    } catch (error) {
      console.error('💥 Unexpected error fetching invite:', error)
      toast.error('Unexpected error loading invitation: ' + error.message)
    }
  }

  // ✅ Enhanced: Handle both new and existing users with password creation
  const handleAcceptInvite = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🚀 Starting invitation acceptance...')
      
      // ✅ Validate password fields
      if (!formData.full_name.trim()) {
        toast.error('Please enter your full name')
        return
      }

      if (!formData.password) {
        toast.error('Please create a password')
        return
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      // Check if user already exists
      const { data: { user: existingUser } } = await supabase.auth.getUser()
      
      if (existingUser) {
        // User is already logged in - handle workspace invitation
        await handleExistingUserInvite(existingUser)
      } else {
        // New user - create account with email and password
        await handleNewUserSignupWithPassword()
      }
    } catch (error) {
      console.error('💥 Error accepting invite:', error)
      toast.error('Error accepting invitation: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExistingUserInvite = async (existingUser) => {
    try {
      // Add user to workspace with the invited role
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: existingUser.id,
          email: inviteData.email,
          workspace_id: inviteData.workspace_id,
          role: inviteData.role,
          status: 'active'
        }, {
          onConflict: 'id,workspace_id'
        })

      if (userError) throw userError

      // Mark invitation as accepted
      await supabase
        .from('user_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('invite_token', token)

      // Show success message with workspace plan info
      const workspacePlan = inviteData.workspaces?.subscription_plan || 'free'
      toast.success(`🎉 Welcome to ${inviteData.workspaces?.name || 'the team'}!`)
      
      if (workspacePlan === 'business') {
        toast.info('🚀 You now have access to Business plan features in this workspace!')
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      throw new Error('Failed to add user to workspace: ' + error.message)
    }
  }

  // ✅ New function: Create user account with password
  const handleNewUserSignupWithPassword = async () => {
    try {
      console.log('🆕 Creating new user account with password...')

      // ✅ Create user account with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          },
          emailRedirectTo: undefined // Prevent confirmation email
        }
      })

      if (signUpError) {
        console.error('❌ Signup error:', signUpError)
        toast.error('Failed to create account: ' + signUpError.message)
        return
      }

      console.log('✅ User account created:', authData.user)

      // ✅ Manually confirm the user (since they're invited)
      if (authData.user && !authData.user.email_confirmed_at) {
        const { error: confirmError } = await supabase.auth.admin.updateUser(
          authData.user.id,
          { email_confirm: true }
        )
        
        if (confirmError) {
          console.error('❌ Error confirming user:', confirmError)
        } else {
          console.log('✅ User email confirmed')
        }
      }

      // Add user to workspace
      const { error: workspaceError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: inviteData.email,
          workspace_id: inviteData.workspace_id,
          role: inviteData.role,
          status: 'active',
          full_name: formData.full_name
        }, {
          onConflict: 'id,workspace_id'
        })

      if (workspaceError) {
        console.error('❌ Workspace error:', workspaceError)
        toast.error('Account created but failed to join workspace')
        return
      }

      // Mark invitation as accepted
      await supabase
        .from('user_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('invite_token', token)

      const workspacePlan = inviteData.workspaces?.subscription_plan || 'free'
      toast.success('🎉 Account created and joined workspace successfully!')
      
      if (workspacePlan === 'business') {
        toast.info('🚀 You now have access to Business plan features!')
      }

      // ✅ Sign in the user automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: inviteData.email,
        password: formData.password
      })

      if (signInError) {
        console.error('❌ Auto sign-in error:', signInError)
        toast.success('Account created! Please log in with your credentials.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        return
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      console.error('💥 Error in signup process:', error)
      toast.error('Failed to create account: ' + error.message)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation Link</h1>
            <p className="text-gray-600 mb-4">The invitation link is missing or invalid.</p>
            <p className="text-sm text-gray-500">Make sure you copied the complete invitation URL.</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 font-medium">Loading invitation...</p>
            <p className="text-sm text-gray-500 mt-2">Validating your invitation token</p>
            
            {/* Debug Info Panel */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-semibold mb-2 text-sm">Debug Info:</h3>
                <div className="text-xs space-y-1 font-mono">
                  <p><strong>Token:</strong> {token?.substring(0, 20)}...</p>
                  <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                  <p><strong>Current Time:</strong> {new Date().toISOString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 You're Invited!</h1>
            <p className="text-gray-600">
              Join{' '}
              <strong className="text-blue-600">
                {inviteData.workspaces?.name || 'the team'}
              </strong>{' '}
              as a <strong className="text-green-600 capitalize">{inviteData.role}</strong>
            </p>

            {/* ✅ Enhanced: Show subscription plan info */}
            {inviteData.workspaces?.subscription_plan && (
              <div className="mt-3">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  inviteData.workspaces.subscription_plan === 'business' 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {inviteData.workspaces.subscription_plan === 'business' && '🚀 '}
                  {inviteData.workspaces.subscription_plan.toUpperCase()} Plan
                </span>
              </div>
            )}
            
            {/* Custom Message */}
            {inviteData.custom_message && (
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-sm italic text-blue-800">"{inviteData.custom_message}"</p>
              </div>
            )}

            {/* Department Badge */}
            {inviteData.department && (
              <div className="mt-3">
                <span className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                  Department: {inviteData.department}
                </span>
              </div>
            )}

            {/* Invitation Details */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Invited by:</span>
                  <span>{inviteData.invited_by_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Expires:</span>
                  <span>{new Date(inviteData.expires_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize font-medium text-green-600">{inviteData.role}</span>
                </div>
                {inviteData.workspaces?.subscription_plan === 'business' && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800 font-medium">
                      🎁 You'll get access to Business features including AI transcription, advanced analytics, and priority support!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Enhanced Form Section with Password Confirmation */}
          <form onSubmit={handleAcceptInvite} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Create a secure password (min 6 characters)"
              />
            </div>

            {/* ✅ Password Confirmation Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Confirm your password"
              />
            </div>

            {/* ✅ Password Strength Indicator */}
            {formData.password && (
              <div className="text-sm space-y-1">
                <div className={`flex items-center gap-2 ${
                  formData.password.length >= 6 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    formData.password.length >= 6 ? 'bg-green-600' : 'bg-red-600'
                  }`}></div>
                  At least 6 characters
                </div>
                <div className={`flex items-center gap-2 ${
                  formData.password === formData.confirmPassword && formData.confirmPassword 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    formData.password === formData.confirmPassword && formData.confirmPassword
                      ? 'bg-green-600' : 'bg-red-600'
                  }`}></div>
                  Passwords match
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.full_name || !formData.password || 
                        formData.password !== formData.confirmPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {inviteData.workspaces?.subscription_plan === 'business' ? 'Joining Business Team...' : 'Creating Account...'}
                </div>
              ) : (
                'Create Account & Join Team'
              )}
            </button>
          </form>

          {/* Debug Panel for Development */}
          {process.env.NODE_ENV === 'development' && debugInfo.token && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm">🐛 Debug Information</h3>
              <div className="text-xs space-y-1 font-mono">
                <p><strong>Token:</strong> {debugInfo.token?.substring(0, 20)}...</p>
                <p><strong>Status:</strong> <span className="text-green-600 font-semibold">{debugInfo.status}</span></p>
                <p><strong>Email:</strong> <span className="text-blue-600">{debugInfo.email}</span></p>
                <p><strong>Role:</strong> <span className="text-purple-600 capitalize">{debugInfo.role}</span></p>
                <p><strong>Expires:</strong> {debugInfo.expiresAt}</p>
                <p><strong>Is Expired:</strong> <span className={debugInfo.isExpired ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{debugInfo.isExpired ? 'YES ❌' : 'NO ✅'}</span></p>
                <p><strong>Workspace ID:</strong> <span className="text-gray-600">{debugInfo.workspaceId}</span></p>
                <p><strong>Plan:</strong> <span className="text-yellow-600">{inviteData.workspaces?.subscription_plan || 'free'}</span></p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By accepting this invitation, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
