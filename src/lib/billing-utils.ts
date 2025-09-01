import { supabase } from '@/lib/supabase'
import { PRICING, calculateTotalCost, formatPrice } from '@/lib/pricing'

export const getActiveUsersForBilling = async (workspaceId: string) => {
  try {
    console.log('🔍 Getting active users for workspace:', workspaceId)
    
    // Get workspace data first
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, subscription_plan, subscription_status, created_at')
      .eq('id', workspaceId)
      .single()

    if (workspaceError) {
      console.error('❌ Error fetching workspace:', workspaceError)
      throw workspaceError
    }

    console.log('🏢 Workspace data:', workspaceData)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]

    // Try to get user activity data (with fallback handling)
    let activeUsers = []

    try {
      const { data: activities, error: activitiesError } = await supabase
        .from('user_activity')
        .select('user_id, activity_date')
        .eq('workspace_id', workspaceId)
        .gte('activity_date', cutoffDate)

      if (activitiesError) throw activitiesError

      if (activities && activities.length > 0) {
        const uniqueUserIds = [...new Set(activities.map(a => a.user_id))]
        
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .in('id', uniqueUserIds)

        if (usersError) throw usersError

        activeUsers = activities.map(activity => {
          const user = users?.find(u => u.id === activity.user_id)
          return {
            user_id: activity.user_id,
            activity_date: activity.activity_date,
            users: user ? {
              email: user.email,
              full_name: user.full_name,
              role: user.role
            } : null
          }
        })
      }
    } catch (queryError) {
      console.warn('⚠️ Activity query failed, using mock data:', queryError)
    }

    // Remove duplicates
    const uniqueUsers = activeUsers?.filter((user, index, self) => 
      index === self.findIndex(u => u.user_id === user.user_id)
    ) || []

    const totalUsers = Math.max(uniqueUsers.length, PRICING.BILLING.includedUsers) // Ensure at least included users

    // ✅ Calculate billing using centralized pricing
    const additionalUsers = Math.max(0, totalUsers - PRICING.BILLING.includedUsers)
    const additionalCost = additionalUsers * PRICING.BILLING.additionalUserPrice
    const basePlanCost = workspaceData.subscription_plan === 'business' ? PRICING.BILLING.basePlanPrice : 0
    const totalCost = calculateTotalCost(totalUsers)

    const billingCalculation = {
      includedUsers: PRICING.BILLING.includedUsers,
      additionalUsers,
      additionalCost,
      totalUsers,
      basePlanCost,
      totalCost
    }

    console.log('💰 Billing calculation:', billingCalculation)

    return {
      activeUsers: uniqueUsers,
      activeUserCount: totalUsers,
      billingCalculation,
      workspace: workspaceData
    }

  } catch (error) {
    console.error('❌ Error in getActiveUsersForBilling:', error)
    
    // Fallback with consistent pricing
    try {
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('id, name, subscription_plan, subscription_status, created_at')
        .eq('id', workspaceId)
        .single()

      return getMockBillingDataWithWorkspace(workspaceData)
    } catch (finalError) {
      return getMockBillingData()
    }
  }
}

// Mock data with consistent pricing
const getMockBillingDataWithWorkspace = (workspaceData: any) => {
  const basePlanCost = workspaceData?.subscription_plan === 'business' ? PRICING.BILLING.basePlanPrice : 0
  
  return {
    activeUsers: [],
    activeUserCount: PRICING.BILLING.includedUsers,
    billingCalculation: {
      includedUsers: PRICING.BILLING.includedUsers,
      additionalUsers: 0,
      additionalCost: 0,
      totalUsers: PRICING.BILLING.includedUsers,
      basePlanCost,
      totalCost: basePlanCost
    },
    workspace: workspaceData
  }
}

const getMockBillingData = () => {
  return {
    activeUsers: [],
    activeUserCount: PRICING.BILLING.includedUsers,
    billingCalculation: {
      includedUsers: PRICING.BILLING.includedUsers,
      additionalUsers: 0,
      additionalCost: 0,
      totalUsers: PRICING.BILLING.includedUsers,
      basePlanCost: PRICING.BILLING.basePlanPrice,
      totalCost: PRICING.BILLING.basePlanPrice
    },
    workspace: {
      name: 'Your Workspace',
      subscription_plan: 'business',
      subscription_status: 'active',
      created_at: new Date().toISOString()
    }
  }
}
