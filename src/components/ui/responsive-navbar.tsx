'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Brain,
  Menu,
  X,
  Home,
  Mic,
  Upload,
  History,
  BarChart3,
  Users,
  Settings,
  User,
  Crown,
  LogOut,
  Plus,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/lib/supabase'
import { useSubscription } from '@/context/SubscriptionContext'

export default function ResponsiveNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const pathname = usePathname()
  const { subscription, loading } = useSubscription()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      closeMobileMenu()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/record', label: 'Record Meeting', icon: Mic },
    { href: '/upload', label: 'Upload Audio', icon: Upload },
    { href: '/meetings', label: 'My Meetings', icon: History },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: Settings }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50 flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Lumina</span>
          </div>

          <div className="w-10" />
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${
        isMobile 
          ? `fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'fixed left-0 top-0 bottom-0 w-72 bg-white shadow-lg z-40'
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Lumina</span>
              <p className="text-xs text-gray-500">AI Meeting Recorder</p>
            </div>
          </div>
          
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={isMobile ? closeMobileMenu : undefined}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Subscription */}
            {!loading && subscription && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={subscription.planName?.toLowerCase() === 'free' ? 'secondary' : 'default'}>
                    <Crown className="h-3 w-3 mr-1" />
                    {subscription.planName || 'Free'}
                  </Badge>
                  
                  {subscription.planName?.toLowerCase() === 'free' && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        router.push('/pricing')
                        if (isMobile) closeMobileMenu()
                      }}
                      className="h-7 text-xs bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Upgrade
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {subscription.currentMeetings || 0}/{subscription.maxMeetings === -1 ? '∞' : subscription.maxMeetings || 3} meetings used
                </p>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}
    </>
  )
}
