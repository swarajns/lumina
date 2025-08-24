'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
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
  Plus
} from 'lucide-react'
import { useSubscription } from '@/context/SubscriptionContext'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Record', href: '/record', icon: Mic },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, requiredPlan: 'Pro' },
  { name: 'Team', href: '/teams', icon: Users, requiredPlan: 'Business' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiredPlan: 'Business' },
  { name: 'Pricing', href: '/pricing', icon: Crown },
]

interface NavigationProps {
  onLinkClick?: () => void
  unreadCount?: number
}

export default function Navigation({ onLinkClick, unreadCount = 0 }: NavigationProps) {
  const pathname = usePathname()
  const { subscription } = useSubscription()

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

  const currentPlan = subscription?.planName || 'Free'

  return (
    <>
      {/* New Meeting Button */}
      <div className="p-4">
        <Link href="/record">
          <Button 
            onClick={onLinkClick}
            className="w-full bg-white text-black hover:bg-gray-800 hover:scale-105 transition-all duration-300 group"
          >
            <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            New Meeting
          </Button>
        </Link>
      </div>

      {/* Navigation Menu - ONLY SIDEBAR LINKS */}
      <nav className="mt-4 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const isLocked = item.requiredPlan && !hasAccess(item.requiredPlan)
            
            return (
              <li key={item.name}>
                <Link
                  href={isLocked ? '/pricing' : item.href}
                  onClick={onLinkClick}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                    isActive
                      ? 'bg-black text-white shadow-lg scale-105'
                      : 'text-black/70 hover:glass hover:text-black hover:scale-102 hover:bg-black/5'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                  {item.name}
                  {isLocked && (
                    <Crown className="ml-auto h-3 w-3 text-amber-500" />
                  )}
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                  {isActive && !isLocked && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-80"></div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Subscription Card */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="glass-card p-4 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-black text-white text-xs">✨ {currentPlan} Plan</Badge>
            <div className="w-8 h-8 glass-button rounded-full flex items-center justify-center">
              <Brain className="h-4 w-4 text-black" />
            </div>
          </div>
          <p className="text-sm text-black/70 leading-relaxed mb-3">
            {currentPlan === 'Free' ? 'Upgrade for unlimited recordings' : 'Unlimited recordings with premium AI'}
          </p>
          {(currentPlan === 'Free' || currentPlan === 'Pro') && (
            <Link href="/pricing">
              <Button className="w-full bg-black text-black hover:bg-gray-800 text-xs hover:scale-105 transition-all group">
                <span className="group-hover:scale-110 transition-transform">
                  {currentPlan === 'Free' ? 'Upgrade to Pro' : 'Upgrade to Business'}
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
