'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserSubscription, UserSubscription } from '@/lib/subscription'

interface SubscriptionContextType {
  subscription: UserSubscription | null
  loading: boolean
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  refreshSubscription: async () => {}
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userSubscription = await getUserSubscription(user.id)
        setSubscription(userSubscription)
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSubscription()
  }, [])

  // Listen for tab visibility changes to refresh subscription
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSubscription()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
