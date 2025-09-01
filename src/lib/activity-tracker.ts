import { supabase } from '@/lib/supabase'

// Track user activity throughout your app
export const trackUserActivity = async (activityType: string = 'general') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!userData?.workspace_id) return

    const today = new Date().toISOString().split('T')[0]

    // One record per user per workspace per day
    await supabase
      .from('user_activity')
      .upsert({
        user_id: user.id,
        workspace_id: userData.workspace_id,
        activity_date: today,
        last_active_at: new Date().toISOString(),
        activity_type: activityType
      }, {
        onConflict: 'user_id,workspace_id,activity_date'
      })

    console.log('✅ User activity tracked for', today)
  } catch (error) {
    console.error('Error tracking user activity:', error)
  }
}
