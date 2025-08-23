'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/context/SubscriptionContext'
import { Button } from '@/components/ui/Button'
import DashboardStats from '@/components/DashboardStats'
import { 
  Mic, 
  Upload, 
  Calendar,
  TrendingUp,
  Zap
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { subscription, loading } = useSubscription()

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  // Check if user has access to analytics (Business plan and above)
  const hasAnalyticsAccess = () => {
    const planHierarchy = {
      'Free': 0,
      'Pro': 1,
      'Business': 2,
      'Enterprise': 3
    }
    const userLevel = planHierarchy[subscription?.planName as keyof typeof planHierarchy] || 0
    return userLevel >= 2 // Business plan level
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Track your meeting productivity and insights</p>
              
              {/* Subscription Status */}
              {subscription && subscription.planName !== 'Free' ? (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        {subscription.planName} Plan - Active ✅
                      </p>
                      <p className="text-xs text-green-600">
                        Expires: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Feature List */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className={subscription.hasAIAnalysis ? 'text-green-700' : 'text-gray-400'}>
                      {subscription.hasAIAnalysis ? '✅' : '❌'} AI Analysis
                    </div>
                    <div className={subscription.hasAdvancedSearch ? 'text-green-700' : 'text-gray-400'}>
                      {subscription.hasAdvancedSearch ? '✅' : '❌'} Advanced Search
                    </div>
                    <div className={subscription.hasExport ? 'text-green-700' : 'text-gray-400'}>
                      {subscription.hasExport ? '✅' : '❌'} Export Features
                    </div>
                    <div className={subscription.hasNotes ? 'text-green-700' : 'text-gray-400'}>
                      {subscription.hasNotes ? '✅' : '❌'} Meeting Notes
                    </div>
                    <div className={hasAnalyticsAccess() ? 'text-green-700' : 'text-gray-400'}>
                      {hasAnalyticsAccess() ? '✅' : '❌'} Analytics {!hasAnalyticsAccess() && '(Business+)'}
                    </div>
                    <div className="text-green-700">
                      ✅ {subscription.maxMeetings === -1 ? 'Unlimited' : subscription.maxMeetings} meetings/month
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    You're on the Free plan. <Button 
                      size="sm" 
                      className="ml-2" 
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade Now
                    </Button>
                  </p>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button onClick={() => router.push('/record')}>
                <Mic className="h-4 w-4 mr-2" />
                Record Meeting
              </Button>
              <Button variant="outline" onClick={() => router.push('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/meetings')}
          >
            <Calendar className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Meeting History</h3>
            <p className="text-primary-700 text-sm">Browse and search all your meetings</p>
          </div>

          <div 
            className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/record')}
          >
            <Zap className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Quick Record</h3>
            <p className="text-green-700 text-sm">Start recording a meeting instantly</p>
          </div>

          <div 
            className={`p-6 rounded-lg cursor-pointer hover:shadow-lg transition-shadow ${
              hasAnalyticsAccess() 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 opacity-50'
            }`}
            onClick={() => {
              if (hasAnalyticsAccess()) {
                router.push('/analytics')
              } else {
                router.push('/pricing')
              }
            }}
          >
            <TrendingUp className={`h-8 w-8 mb-3 ${
              hasAnalyticsAccess() ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              hasAnalyticsAccess() ? 'text-blue-900' : 'text-gray-500'
            }`}>
              Analytics {!hasAnalyticsAccess() && '🔒'}
            </h3>
            <p className={`text-sm ${
              hasAnalyticsAccess() ? 'text-blue-700' : 'text-gray-500'
            }`}>
              {hasAnalyticsAccess() 
                ? 'Deep insights into your meeting patterns'
                : 'Upgrade to Business to unlock analytics'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
