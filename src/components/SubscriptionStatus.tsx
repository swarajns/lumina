'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserSubscription, type UserSubscription } from '@/lib/subscription'

interface Props {
  userId: string
}

export default function SubscriptionStatus({ userId }: Props) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const userSubscription = await getUserSubscription(userId)
        setSubscription(userSubscription)
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchSubscription()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (!subscription || subscription.planName === 'Free') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-1">Free Plan</h3>
        <p className="text-sm text-yellow-700">
          You're currently on the free plan. Upgrade to unlock premium features.
        </p>
        <div className="mt-2 text-xs text-yellow-600">
          <p>• 3 meetings per month</p>
          <p>• Basic transcription only</p>
        </div>
      </div>
    )
  }

  const expiryDate = new Date(subscription.currentPeriodEnd)
  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-green-800">
          {subscription.planName} Plan - Active ✅
        </h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          {subscription.billingCycle}
        </span>
      </div>
      
      <p className="text-sm text-green-700 mb-3">
        Expires: {expiryDate.toLocaleDateString()} ({daysLeft} days left)
      </p>
      
      <div className="text-xs text-green-600 space-y-1">
        <p>✅ Meetings: {subscription.maxMeetings === -1 ? 'Unlimited' : subscription.maxMeetings}/month</p>
        <p>✅ AI Analysis: {subscription.hasAIAnalysis ? 'Yes' : 'No'}</p>
        <p>✅ Advanced Search: {subscription.hasAdvancedSearch ? 'Yes' : 'No'}</p>
        <p>✅ Export: {subscription.hasExport ? 'Yes' : 'No'}</p>
        <p>✅ Notes: {subscription.hasNotes ? 'Yes' : 'No'}</p>
        <p>✅ Analytics: {subscription.hasAnalytics ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
