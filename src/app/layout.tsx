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

const inter = Inter({ subsets: ['latin'] })

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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Don't redirect if on public pages
      if (!user && !['/login', '/signup', '/'].includes(pathname)) {
        router.push('/login')
        return
      }

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setUser({ ...user, profile })
      }
      
      setLoading(false)
      fetchUnreadCount()
    }

    getUser()
  }, [router, pathname])

  const fetchUnreadCount = async () => {
    setUnreadCount(3)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/')
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Record', href: '/record' },
    { name: 'Upload', href: '/upload' },
    { name: 'Meetings', href: '/meetings' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Team', href: '/teams' },
    { name: 'Notifications', href: '/notifications' },
    { name: 'Analytics', href: '/analytics' },
  ]

  // Show loading for authenticated routes only
  if (loading && !['/login', '/signup', '/'].includes(pathname)) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-white antialiased`}>
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="glass-card p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto mb-4"></div>
              <div className="text-black font-medium">Loading your workspace...</div>
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
        <body className={`${inter.className} bg-white antialiased`}>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
          <Toaster position="top-right" />
        </body>
      </html>
    )
  }

  // Show public home page with simple navigation
  if (!user && pathname === '/') {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-white antialiased`}>
          <SubscriptionProvider>
            <div className="min-h-screen bg-white">
              <nav className="glass-nav sticky top-0 z-50 border-b border-black/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center">
                      <Link href="/" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-black">Lumina</span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href="/login">
                        <Button variant="outline" className="glass-button">Sign In</Button>
                      </Link>
                      <Link href="/pricing">
                        <Button className="bg-black text-white hover:bg-gray-800">Get Started</Button>
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

  // Show full dashboard navigation for authenticated users
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white antialiased`}>
        <SubscriptionProvider>
          <div className="min-h-screen bg-white flex">
            {/* Responsive Glassmorphism Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 glass-sidebar transition-transform duration-300 ease-in-out ${
              isMobile 
                ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full')
                : 'translate-x-0'
            }`}>
              {/* Logo Section */}
              <div className="flex items-center h-16 px-6 border-b border-black/10">
                <div className="glass-button p-2 rounded-xl hover:scale-110 transition-all duration-300">
                  <Brain className="h-8 w-8 text-black" />
                </div>
                <span className="ml-3 text-xl font-bold text-black">Lumina</span>
                
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

              {/* Navigation Component (ONLY sidebar links) */}
              <Navigation onLinkClick={handleMobileLinkClick} unreadCount={unreadCount} />
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
              {/* Top Navigation - ONLY ONE HEADER */}
              <header className="glass-nav h-16 sticky top-0 z-30 border-b border-black/10">
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
                    
                    <h1 className="text-xl font-semibold text-black">
                      {navigation.find(item => item.href === pathname)?.name || 'Lumina'}
                    </h1>
                    <Badge className="bg-black text-white text-xs animate-pulse hidden sm:block">
                      Premium Experience
                    </Badge>
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
                              <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-xs">
                                {unreadCount} new
                              </Badge>
                            </div>
                          </div>
                          <div className="p-4 border-t border-black/10 bg-black/2">
                            <Link href="/notifications">
                              <Button className="w-full bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all">
                                View All Notifications
                              </Button>
                            </Link>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* User Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="glass-button flex items-center space-x-3 text-black border-black/20 px-4 py-2 hover:scale-105 transition-all duration-300">
                          <Avatar className="h-8 w-8 border-2 border-black/20">
                            <AvatarImage src={user?.profile?.avatar_url} />
                            <AvatarFallback className="bg-black/10 text-black font-semibold">
                              {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {user?.profile?.full_name || 'User'}
                            </span>
                            <span className="text-xs text-black/50 truncate max-w-32">
                              {user?.email}
                            </span>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 glass-card border-black/20 backdrop-blur-md">
                        <DropdownMenuItem asChild className="text-black hover:bg-black/5 focus:bg-black/5 transition-all">
                          <Link href="/billing">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Billing & Subscription
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild className="text-black hover:bg-black/5 focus:bg-black/5 transition-all">
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
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
                          className="text-black hover:bg-black/5 focus:bg-black/5 transition-all"
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
              <main className="flex-grow p-6 bg-white overflow-auto">
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
