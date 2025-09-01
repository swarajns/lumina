'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getActiveUsersForBilling } from '@/lib/billing-utils'
import { trackUserActivity } from '@/lib/activity-tracker'

// Icons (SVG Components)
const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const UsersIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const CreditCardIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const TrendingUpIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
)

const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function BillingPage() {
  const [billingData, setBillingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    trackUserActivity('billing_view')
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    // ✅ Use separate queries to avoid relationship ambiguity
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id, role')
      .eq('id', user.id)
      .single()

    if (userError) {
      throw new Error('Failed to load user data: ' + userError.message)
    }

    if (!userData?.workspace_id) {
      throw new Error('No workspace found for user')
    }

    // ✅ Get workspace data separately
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, subscription_plan, subscription_status, created_at')
      .eq('id', userData.workspace_id)
      .single()

    if (workspaceError) {
      throw new Error('Failed to load workspace: ' + workspaceError.message)
    }

    console.log('🏢 Workspace data:', workspaceData)
    console.log('📋 Subscription plan:', workspaceData.subscription_plan)

    // ✅ Get billing data
    const billing = await getActiveUsersForBilling(userData.workspace_id)
    
    setBillingData({
      ...billing,
      workspace: workspaceData, // Use the separately fetched workspace data
      userRole: userData.role,
      currentUser: user
    })
    
    console.log('✅ Final billing data loaded successfully')

  } catch (error) {
    console.error('💥 Error loading billing data:', error)
    setError(error.message)
  } finally {
    setLoading(false)
  }
}

  const exportBillingData = () => {
    const csvContent = `Name,Email,Role,Status,Cost
${billingData.activeUsers.map(user => 
  `${user.users?.full_name || 'Unknown'},${user.users?.email || 'N/A'},${user.users?.role || 'member'},Active,${billingData.activeUsers.indexOf(user) < billingData.billingCalculation.includedUsers ? 'Included' : '$8/month'}`
).join('\n')}`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Loading Your Billing Dashboard</h2>
          <p className="text-gray-500">Gathering your usage data and calculating costs...</p>
          <div className="mt-4 flex items-center justify-center space-x-1">
            <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full" style={{animationDelay: '0.1s'}}></div>
            <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-2xl">
          <div className="text-red-500 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Billing</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/support'}
              className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { billingCalculation, workspace, activeUsers, userRole } = billingData
  
  // Calculate metrics
  const nextBillingDate = new Date()
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
  
  const potentialCost = billingCalculation.totalUsers * 15
  const savings = potentialCost - billingCalculation.totalCost

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Billing Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Managing <strong className="text-blue-600">{workspace?.name || 'your workspace'}</strong>
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Member since {new Date(workspace?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Savings Badge */}
              <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                <p className="text-sm font-medium opacity-90">Monthly Savings</p>
                <p className="text-2xl font-bold">${savings.toFixed(2)}</p>
                <p className="text-xs opacity-75">vs. traditional pricing</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={exportBillingData}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Export Report
                </button>
                {userRole === 'owner' && (
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <TrendingUpIcon className="w-4 h-4 mr-2" />
                    Manage Plan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: TrendingUpIcon },
                { id: 'users', name: 'Users', icon: UsersIcon },
                { id: 'billing', name: 'Billing History', icon: CreditCardIcon },
                { id: 'settings', name: 'Settings', icon: SettingsIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {/* Current Plan */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl">
                    <TrendingUpIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
                    <p className="text-sm text-gray-500">Active subscription</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {workspace?.subscription_plan?.toUpperCase() || 'FREE'}
                </p>
              </div>

              {/* Active Users */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
                    <p className="text-sm text-gray-500">Last 30 days</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {billingCalculation.totalUsers}
                </p>
                <p className="text-sm text-gray-500">
                  {billingCalculation.includedUsers} included + {billingCalculation.additionalUsers} additional
                </p>
              </div>

              {/* Monthly Cost */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl">
                    <CreditCardIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Cost</h3>
                    <p className="text-sm text-gray-500">Current period</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-1">
                  ${billingCalculation.totalCost.toFixed(2)}
                </p>
                <p className="text-sm text-green-600">Fair billing applied ✨</p>
              </div>

              {/* Next Billing */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Next Billing</h3>
                    <p className="text-sm text-gray-500">Automatic renewal</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-1">
                  {nextBillingDate.getDate()}
                </p>
                <p className="text-sm text-gray-500">
                  {nextBillingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Billing Breakdown & Features */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Detailed Billing */}
              <div className="lg:col-span-2">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Billing Breakdown</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Monthly
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-4 border-b border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900">Business Plan Base</p>
                        <p className="text-sm text-gray-500">Includes {billingCalculation.includedUsers} users</p>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        ${billingCalculation.basePlanCost}
                      </span>
                    </div>

                    {billingCalculation.additionalUsers > 0 && (
                      <div className="flex justify-between items-center py-4 border-b border-gray-100">
                        <div>
                          <p className="font-semibold text-gray-900">Additional Active Users</p>
                          <p className="text-sm text-gray-500">
                            {billingCalculation.additionalUsers} users × $8/month
                          </p>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          ${billingCalculation.additionalCost.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 px-6 rounded-xl">
                      <div>
                        <p className="text-xl font-bold text-gray-900">Total Monthly Cost</p>
                        <p className="text-sm text-green-600 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Only pay for active users
                        </p>
                      </div>
                      <span className="text-4xl font-bold text-blue-600">
                        ${billingCalculation.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Fair Billing Explanation */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <div className="flex items-start">
                      <div className="bg-green-500 p-2 rounded-lg mr-4">
                        <CheckIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-900 mb-2">🎉 Fair Billing Advantage</h4>
                        <p className="text-green-800 leading-relaxed">
                          You only pay for users who were active in the last 30 days. If a team member takes time off 
                          or leaves, you automatically stop paying for them. This saves you <strong>${savings.toFixed(2)}/month</strong> compared 
                          to traditional per-seat pricing!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Plan Features</h3>
                
                <div className="space-y-4">
                  {[
                    { feature: 'Unlimited meetings & participants', premium: true },
                    { feature: 'AI-powered transcription', premium: true },
                    { feature: 'Advanced analytics & insights', premium: true },
                    { feature: 'Priority customer support', premium: true },
                    { feature: 'Custom branding options', premium: true },
                    { feature: 'Integration with Slack & Teams', premium: true },
                    { feature: 'Advanced security features', premium: true },
                    { feature: 'Fair billing with active user tracking', premium: true }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{item.feature}</span>
                      </div>
                      {item.premium && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          PREMIUM
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {userRole === 'owner' && (
                  <div className="mt-8 space-y-3">
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                    >
                      Upgrade Plan
                    </button>
                    <button className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors font-semibold">
                      Contact Support
                    </button>
                  </div>
                )}

                {/* Usage Tips */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <h5 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <BellIcon className="w-4 h-4 mr-2" />
                    Pro Tips
                  </h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Inactive users are automatically excluded from billing</li>
                    <li>• Invite unlimited users without upfront costs</li>
                    <li>• View detailed usage reports anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Active Users ({billingCalculation.totalUsers})
                  </h3>
                  <p className="text-gray-500 mt-1">Users active in the last 30 days</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                    Last 30 Days
                  </div>
                  <button 
                    onClick={exportBillingData}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Export Users
                  </button>
                </div>
              </div>

              {activeUsers && activeUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-2 font-semibold text-gray-900">User</th>
                        <th className="text-left py-4 px-2 font-semibold text-gray-900">Role</th>
                        <th className="text-left py-4 px-2 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-4 px-2 font-semibold text-gray-900">Billing</th>
                        <th className="text-left py-4 px-2 font-semibold text-gray-900">Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeUsers.map((user, index) => (
                        <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                                {(user.users?.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{user.users?.full_name || 'Unknown User'}</p>
                                <p className="text-sm text-gray-500">{user.users?.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                              {user.users?.role || 'member'}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                              <span className="text-sm text-green-600 font-medium">Active</span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            {index < billingCalculation.includedUsers ? (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Included
                              </span>
                            ) : (
                              <span className="font-semibold text-gray-900">$8/month</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="text-sm text-gray-500">
                              Last seen: {new Date().toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <UsersIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-2xl font-semibold text-gray-900 mb-2">No Active Users</h4>
                  <p className="text-gray-500 text-lg mb-6">
                    No users have been active in the last 30 days.
                  </p>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Invite Team Members
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Billing History</h3>
            <div className="text-center py-16">
              <CreditCardIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h4>
              <p className="text-gray-500">
                Billing history and invoice management will be available in the next update.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Billing Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive billing updates and invoices via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Usage Alerts</h4>
                  <p className="text-sm text-gray-500">Get notified when approaching billing thresholds</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Manage Your Plan</h3>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center py-8">
              <TrendingUpIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                You're already on our best plan!
              </h4>
              <p className="text-gray-600 mb-6">
                The Business plan includes all premium features with fair, usage-based billing.
              </p>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Contact Sales for Enterprise
                </button>
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
