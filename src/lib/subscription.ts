import { supabase } from './supabase'

export interface UserSubscription {
  id: string
  planName: string
  status: 'active' | 'expired' | 'cancelled'
  billingCycle: 'monthly' | 'yearly'
  currentPeriodStart: string
  currentPeriodEnd: string
  maxMeetings: number
  hasAIAnalysis: boolean
  hasAdvancedSearch: boolean
  hasExport: boolean
  hasNotes: boolean
  hasAnalytics: boolean
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    // Read from the 'subscriptions' table (not 'user_subscriptions')
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('activated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Return default Free plan
      return {
        id: 'free',
        planName: 'Free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxMeetings: 3,
        hasAIAnalysis: false,
        hasAdvancedSearch: false,
        hasExport: false,
        hasNotes: false,
        hasAnalytics: false
      }
    }

    // Map database fields to interface
    return {
      id: data.id,
      planName: data.plan_name, // Use plan_name from subscriptions table
      status: data.status,
      billingCycle: data.billing_cycle,
      currentPeriodStart: data.activated_at,
      currentPeriodEnd: data.expires_at,
      maxMeetings: getPlanLimits(data.plan_name).maxMeetings,
      hasAIAnalysis: getPlanLimits(data.plan_name).hasAIAnalysis,
      hasAdvancedSearch: getPlanLimits(data.plan_name).hasAdvancedSearch,
      hasExport: getPlanLimits(data.plan_name).hasExport,
      hasNotes: getPlanLimits(data.plan_name).hasNotes,
      hasAnalytics: getPlanLimits(data.plan_name).hasAnalytics
    }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return null
  }
}

function getPlanLimits(planName: string) {
  const limits = {
    'Free': { maxMeetings: 3, hasAIAnalysis: false, hasAdvancedSearch: false, hasExport: false, hasNotes: false, hasAnalytics: false },
    'Pro': { maxMeetings: 50, hasAIAnalysis: true, hasAdvancedSearch: true, hasExport: true, hasNotes: true, hasAnalytics: false },
    'Business': { maxMeetings: -1, hasAIAnalysis: true, hasAdvancedSearch: true, hasExport: true, hasNotes: true, hasAnalytics: true },
    'Enterprise': { maxMeetings: -1, hasAIAnalysis: true, hasAdvancedSearch: true, hasExport: true, hasNotes: true, hasAnalytics: true }
  }
  
  return limits[planName as keyof typeof limits] || limits['Free']
}

// Helper function to check if user has access to a feature
export async function hasFeatureAccess(userId: string, feature: keyof UserSubscription): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  if (!subscription) return false
  return subscription[feature] as boolean
}
