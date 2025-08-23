'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Mic, 
  Upload, 
  Calendar, 
  CheckSquare, 
  Users, 
  Bell, 
  BarChart3,
  Home,
  Crown,
  Zap,
  LogOut,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSubscription } from '@/context/SubscriptionContext'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Record', href: '/record', icon: Mic },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Pricing', href: '/pricing', icon: Crown },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, requiredPlan: 'Pro' },
  { name: 'Team', href: '/team', icon: Users, requiredPlan: 'Business' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiredPlan: 'Business' }, // Business and above
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { subscription, loading, refreshSubscription } = useSubscription()
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [meetingsCount, setMeetingsCount] = useState(0)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (event === 'SIGNED_IN') {
        refreshSubscription()
      }
    })

    return () => authSubscription.unsubscribe()
  }, [refreshSubscription])

  useEffect(() => {
    if (user) {
      checkMeetingsCount()
    }
  }, [user])

  const checkMeetingsCount = async () => {
    try {
      const thisMonthStart = new Date()
      thisMonthStart.setDate(1)
      thisMonthStart.setHours(0, 0, 0, 0)

      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, created_at')
        .gte('created_at', thisMonthStart.toISOString())

      if (error) throw error

      setMeetingsCount(meetings?.length || 0)
    } catch (error) {
      console.error('Error checking meetings count:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    setIsMenuOpen(false)
  }

  const getPlanColor = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'pro': return 'from-blue-50 to-blue-100 text-blue-800'
      case 'business': return 'from-purple-50 to-purple-100 text-purple-800'
      case 'enterprise': return 'from-emerald-50 to-emerald-100 text-emerald-800'
      default: return 'from-gray-50 to-gray-100 text-gray-800'
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'pro': return <Zap className="h-3 w-3" />
      case 'business': return <Crown className="h-3 w-3" />
      case 'enterprise': return <Crown className="h-3 w-3 text-emerald-600" />
      default: return <div className="w-3 h-3 bg-gray-500 rounded-full" />
    }
  }

  // Check if user has access to a feature based on plan hierarchy
  const hasAccess = (requiredPlan: string) => {
    const planHierarchy = {
      'Free': 0,
      'Pro': 1,
      'Business': 2,
      'Enterprise': 3
    }

    const userLevel = planHierarchy[subscription?.planName as keyof typeof planHierarchy] || 0
    const requiredLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy] || 0

    return userLevel >= requiredLevel
  }

  if (!user) {
    return (
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Lumina</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/pricing">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const currentPlan = subscription?.planName || 'Free'
  const maxMeetings = subscription?.maxMeetings || 3
  const isNearLimit = meetingsCount >= maxMeetings * 0.8
  const isAtLimit = meetingsCount >= maxMeetings && currentPlan === 'Free'

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Lumina</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                const isLocked = item.requiredPlan && !hasAccess(item.requiredPlan)
                
                return (
                  <Link
                    key={item.name}
                    href={isLocked ? '/pricing' : item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                      isLocked && "opacity-60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {isLocked && (
                      <Crown className="h-3 w-3 text-amber-500" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {/* Subscription Status */}
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
              ) : (
                <div className={`hidden sm:flex items-center space-x-2 bg-gradient-to-r px-3 py-1.5 rounded-lg ${getPlanColor(currentPlan)}`}>
                  {getPlanIcon(currentPlan)}
                  <span className="text-sm font-medium">
                    {currentPlan} Plan
                  </span>
                  {currentPlan === 'Free' && (
                    <span className={`text-xs ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-gray-600'}`}>
                      {meetingsCount}/{maxMeetings}
                    </span>
                  )}
                </div>
              )}
              
              {/* Upgrade Button */}
              {(currentPlan === 'Free' || currentPlan === 'Pro') && (
                <Button 
                  size="sm" 
                  onClick={() => router.push('/pricing')}
                  className={`${isAtLimit ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  {isAtLimit ? 'Upgrade Now' : currentPlan === 'Free' ? 'Upgrade' : 'Upgrade to Business'}
                </Button>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-50"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 
                     user?.email?.toUpperCase() || 
                     'U'}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 
                           user?.email?.toUpperCase() || 
                           'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      
                      {/* Subscription Status in Dropdown */}
                      {subscription && subscription.planName !== 'Free' ? (
                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {subscription.planName} Plan - Active
                            </span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Expires: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                          <div className="mt-2 text-xs text-green-700 space-y-1">
                            <p>✅ Meetings: {subscription.maxMeetings === -1 ? 'Unlimited' : `${subscription.maxMeetings}/month`}</p>
                            <p>✅ AI Analysis: {subscription.hasAIAnalysis ? 'Enabled' : 'Disabled'}</p>
                            <p>✅ Export: {subscription.hasExport ? 'Enabled' : 'Disabled'}</p>
                            <p>✅ Analytics: {subscription.hasAnalytics ? 'Enabled' : 'Business+ only'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Free Plan</p>
                              <p className="text-xs text-yellow-600">
                                {meetingsCount}/{maxMeetings} meetings used
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setIsMenuOpen(false)
                                router.push('/pricing')
                              }}
                            >
                              Upgrade
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                    </Link>

                    <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Crown className="h-4 w-4" />
                        Subscription
                      </button>
                    </Link>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Limit Warning Banners */}
      {isAtLimit && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-800">
                You've reached your monthly limit of {maxMeetings} meetings.
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={() => router.push('/pricing')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && currentPlan === 'Free' && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-800">
                You're approaching your monthly limit ({meetingsCount}/{maxMeetings} meetings used).
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => router.push('/pricing')}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              View Plans
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const isLocked = item.requiredPlan && !hasAccess(item.requiredPlan)
              
              return (
                <Link
                  key={item.name}
                  href={isLocked ? '/pricing' : item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    isLocked && "opacity-60"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {isLocked && <Crown className="h-3 w-3 text-amber-500" />}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
