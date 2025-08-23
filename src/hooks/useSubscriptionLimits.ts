import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface SubscriptionLimits {
  maxMeetings: number
  maxDuration: number // in seconds, -1 for unlimited
  hasAIAnalysis: boolean
  hasAdvancedSearch: boolean
  hasExport: boolean
  hasNotes: boolean
  hasAnalytics: boolean
  currentMeetings: number
  canRecord: boolean
  canUpload: boolean
  planName: string
  isAtLimit: boolean
  isNearLimit: boolean
  remainingMeetings: number
  upgradeReason: string | null
}

const PLAN_CONFIGS = {
  'Free': {
    maxMeetings: 3,
    maxDuration: 1800, // 30 minutes
    hasAIAnalysis: false,
    hasAdvancedSearch: false,
    hasExport: false,
    hasNotes: false,
    hasAnalytics: false,
  },
  'Pro': {
    maxMeetings: 50,
    maxDuration: -1, // unlimited
    hasAIAnalysis: true,
    hasAdvancedSearch: true,
    hasExport: true,
    hasNotes: true,
    hasAnalytics: false,
  },
  'Business': {
    maxMeetings: -1, // unlimited
    maxDuration: -1,
    hasAIAnalysis: true,
    hasAdvancedSearch: true,
    hasExport: true,
    hasNotes: true,
    hasAnalytics: true,
  },
  'Enterprise': {
    maxMeetings: -1,
    maxDuration: -1,
    hasAIAnalysis: true,
    hasAdvancedSearch: true,
    hasExport: true,
    hasNotes: true,
    hasAnalytics: true,
  }
}

export function useSubscriptionLimits() {
  const [limits, setLimits] = useState<SubscriptionLimits>({
    maxMeetings: 3,
    maxDuration: 1800,
    hasAIAnalysis: false,
    hasAdvancedSearch: false,
    hasExport: false,
    hasNotes: false,
    hasAnalytics: false,
    currentMeetings: 0,
    canRecord: true,
    canUpload: true,
    planName: 'Free',
    isAtLimit: false,
    isNearLimit: false,
    remainingMeetings: 3,
    upgradeReason: null
  })
  const [loading, setLoading] = useState(true)

  const checkLimits = useCallback(async () => {
    try {
      setLoading(true)

      // Get current month's meetings count
      const thisMonthStart = new Date()
      thisMonthStart.setDate(1)
      thisMonthStart.setHours(0, 0, 0, 0)

      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, created_at, duration')
        .gte('created_at', thisMonthStart.toISOString())

      if (error) throw error

      const currentMeetings = meetings?.length || 0

      // For now, everyone gets Free tier (later integrate with actual user subscriptions)
      const currentPlan = 'Free'
      const planConfig = PLAN_CONFIGS[currentPlan]

      const remainingMeetings = planConfig.maxMeetings === -1 
        ? Infinity 
        : Math.max(0, planConfig.maxMeetings - currentMeetings)

      const isAtLimit = planConfig.maxMeetings !== -1 && currentMeetings >= planConfig.maxMeetings
      const isNearLimit = planConfig.maxMeetings !== -1 && currentMeetings >= planConfig.maxMeetings * 0.8

      let upgradeReason = null
      if (isAtLimit) {
        upgradeReason = `You've used all ${planConfig.maxMeetings} meetings this month`
      } else if (isNearLimit) {
        upgradeReason = `You're approaching your monthly limit (${currentMeetings}/${planConfig.maxMeetings})`
      }

      setLimits({
        ...planConfig,
        currentMeetings,
        canRecord: !isAtLimit,
        canUpload: !isAtLimit,
        planName: currentPlan,
        isAtLimit,
        isNearLimit,
        remainingMeetings: remainingMeetings === Infinity ? -1 : remainingMeetings,
        upgradeReason
      })

    } catch (error) {
      console.error('Error checking subscription limits:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkLimits()
  }, [checkLimits])

  return { limits, loading, refresh: checkLimits }
}
