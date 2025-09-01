'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Bell,
  CreditCard,
  Settings, 
  LogOut, 
  HelpCircle,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import { Toaster } from 'sonner'
import Navigation from '@/components/Navigation'
import { trackUserActivity } from '@/lib/activity-tracker'

// ✅ Fixed Inter font configuration
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Arial', 'sans-serif']
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [workspaceInfo, setWorkspaceInfo] = useState<any>(null)
  
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [isMobileMenuOpen])

  // Close menu on route change AND scroll to top
  useEffect(() => {
    setIsMobileMenuOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // ✅ Enhanced user authentication with workspace info
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        // Don't redirect if on public pages or accept-invite
        const publicPages = ['/login', '/signup', '/accept-invite', '/', '/pricing', '/about', '/contact']
        if (!user && !publicPages.includes(pathname)) {
          router.push('/login')
          return
        }

        if (user) {
          // ✅ Track user activity when they access the app
          await trackUserActivity('app_visit')

          // Get user profile and workspace info
          const [profileResult, userResult] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('users').select(`
              *,
              workspaces(name, subscription_plan)
            `).eq('id', user.id).single()
          ])

          const profile = profileResult.data
          const userData = userResult.data

          setUser({ 
            ...user, 
            profile,
            role: userData?.role,
            workspace_id: userData?.workspace_id
          })

          if (userData?.workspaces) {
            setWorkspaceInfo(userData.workspaces)
          }
        }
        
        setLoading(false)
        await fetchUnreadCount()
      } catch (error) {
        console.error('Error loading user:', error)
        setLoading(false)
      }
    }

    getUser()
  }, [router, pathname])

  // ✅ Enhanced notification count
  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false)

      if (!error && notifications) {
        setUnreadCount(notifications.length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setUnreadCount(0)
    }
  }

  // ✅ Enhanced logout with activity tracking
  const handleLogout = async () => {
    try {
      await trackUserActivity('logout')
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Error logging out')
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const handleMobileLinkClick = () => {
    if (isMobile) {
      setTimeout(() => setIsMobileMenuOpen(false), 100)
    }
  }

  // ✅ Enhanced navigation with billing
  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Record', href: '/record' },
    { name: 'Upload', href: '/upload' },
    { name: 'Meetings', href: '/meetings' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Team', href: '/teams' },
    { name: 'Billing', href: '/billing' }, // ✅ Added billing to navigation
    { name: 'Notifications', href: '/notifications' },
    { name: 'Analytics', href: '/analytics' },
  ]

  // ✅ Enhanced loading screen
  if (loading && !['/login', '/signup', '/', '/accept-invite', '/pricing'].includes(pathname)) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased`}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="glass-card p-8 text-center max-w-md">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Workspace</h2>
              <p className="text-gray-600">Please wait while we set up your environment...</p>
              <div className="mt-4 flex items-center justify-center space-x-1">
                <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full" style={{animationDelay: '0.1s'}}></div>
                <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  }

  // Show login/signup pages without navigation
  if (!user && ['/login', '/signup'].includes(pathname)) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased`}>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
          <Toaster position="top-right" />
        </body>
      </html>
    )
  }

  // Show accept-invite page without navigation
  if (pathname === '/accept-invite') {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased`}>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
          <Toaster position="top-right" />
        </body>
      </html>
    )
  }

  // ✅ Enhanced public home page
  if (!user && ['/', '/pricing', '/about', '/contact'].includes(pathname)) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased`}>
          <SubscriptionProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
              <nav className="glass-nav sticky top-0 z-50 border-b border-black/10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center">
                      <Link href="/" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-black">Luminameeting</span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href="/pricing">
                        <Button variant="outline" className="glass-button">Pricing</Button>
                      </Link>
                      <Link href="/login">
                        <Button variant="outline" className="glass-button">Sign In</Button>
                      </Link>
                      <Link href="/signup">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                          Get Started Free
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </nav>
              <main>{children}</main>
            </div>
          </SubscriptionProvider>
          <Toaster position="top-right" />
        </body>
      </html>
    )
  }

  // ✅ Enhanced dashboard layout with workspace info
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased`}>
        <SubscriptionProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
            {/* Responsive Glassmorphism Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 glass-sidebar transition-transform duration-300 ease-in-out backdrop-blur-md ${
              isMobile 
                ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full')
                : 'translate-x-0'
            }`}>
              {/* Logo Section */}
              <div className="flex items-center h-16 px-6 border-b border-black/10">
                <div className="glass-button p-2 rounded-xl hover:scale-110 transition-all duration-300">
                  <Brain className="h-8 w-8 text-black" />
                </div>
                <div className="ml-3">
                  <span className="text-xl font-bold text-black">Luminameeting</span>
                  {workspaceInfo && (
                    <p className="text-xs text-gray-600 truncate max-w-32">
                      {workspaceInfo.name}
                    </p>
                  )}
                </div>
                
                {/* Mobile Close Button */}
                {isMobile && (
                  <button
                    onClick={closeMobileMenu}
                    className="ml-auto glass-button p-2 text-black border-black/20 hover:scale-105 transition-all rounded-lg"
                    type="button"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Navigation Component */}
              <Navigation onLinkClick={handleMobileLinkClick} unreadCount={unreadCount} />

              {/* ✅ Workspace Info Footer */}
              {workspaceInfo && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/10 bg-white/50 backdrop-blur-md">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      workspaceInfo.subscription_plan === 'business' 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workspaceInfo.subscription_plan === 'business' && '🚀 '}
                      {workspaceInfo.subscription_plan?.toUpperCase() || 'FREE'} Plan
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Overlay */}
            {isMobile && isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={closeMobileMenu}
                onTouchEnd={closeMobileMenu}
              />
            )}

            {/* Main Content Area - Responsive */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
              isMobile ? 'ml-0' : 'ml-64'
            }`}>
              {/* ✅ Enhanced Top Navigation */}
              <header className="glass-nav h-16 sticky top-0 z-30 border-b border-black/10 backdrop-blur-md">
                <div className="flex items-center justify-between h-full px-6">
                  <div className="flex items-center space-x-4">
                    {/* Mobile Hamburger Menu */}
                    {isMobile && (
                      <button
                        onClick={toggleMobileMenu}
                        className="glass-button p-2 text-black border-black/20 hover:scale-105 transition-all rounded-lg"
                        type="button"
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                      >
                        {isMobileMenuOpen ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <Menu className="h-5 w-5" />
                        )}
                      </button>
                    )}
                    
                    <div>
                      <h1 className="text-xl font-semibold text-black">
                        {navigation.find(item => item.href === pathname)?.name || 'Luminameeting'}
                      </h1>
                      {workspaceInfo && (
                        <p className="text-xs text-gray-600">
                          {workspaceInfo.name}
                        </p>
                      )}
                    </div>
                    
                    {workspaceInfo?.subscription_plan === 'business' && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs animate-pulse hidden sm:block">
                        🚀 Business Plan
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Notification Bell */}
                    <div className="hidden sm:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="glass-button text-black border-black/20 h-10 w-10 p-0 hover:scale-110 transition-all relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-96 glass-card border-black/20 backdrop-blur-md p-0">
                          <div className="p-4 border-b border-black/10">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-black">Notifications</h3>
                              {unreadCount > 0 && (
                                <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-xs">
                                  {unreadCount} new
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="p-4">
                            {unreadCount > 0 ? (
                              <div className="space-y-3">
                                <p className="text-sm text-gray-600">You have {unreadCount} unread notifications</p>
                                <Link href="/notifications">
                                  <Button className="w-full bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all">
                                    View All Notifications
                                  </Button>
                                </Link>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">No new notifications</p>
                              </div>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* ✅ Enhanced User Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="glass-button flex items-center space-x-3 text-black border-black/20 px-4 py-2 hover:scale-105 transition-all duration-300">
                          <Avatar className="h-8 w-8 border-2 border-black/20">
                            <AvatarImage src={user?.profile?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                              {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {user?.profile?.full_name || 'User'}
                            </span>
                            <span className="text-xs text-black/50 truncate max-w-32">
                              {user?.role || 'Member'}
                            </span>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 glass-card border-black/20 backdrop-blur-md">
                        {/* User Info Header */}
                        <div className="px-3 py-2 border-b border-black/10">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user?.profile?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                                {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black truncate">
                                {user?.profile?.full_name || 'User'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user?.email}
                              </p>
                              <p className="text-xs text-blue-600 capitalize">
                                {user?.role || 'Member'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <DropdownMenuItem asChild className="text-black hover:bg-black/5 focus:bg-black/5 transition-all">
                          <Link href="/billing">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Billing & Usage
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild className="text-black hover:bg-black/5 focus:bg-black/5 transition-all">
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Account Settings
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild className="text-black hover:bg-black/5 focus:bg-black/5 transition-all">
                          <Link href="/help">
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Help & Support
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-black/20" />
                        <DropdownMenuItem 
                          onClick={handleLogout}
                          className="text-red-600 hover:bg-red-50 focus:bg-red-50 transition-all"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </header>

              {/* Page Content */}
              <main className="flex-grow p-6 bg-transparent overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SubscriptionProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
