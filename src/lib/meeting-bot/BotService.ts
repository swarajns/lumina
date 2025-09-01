// src/lib/meeting-bot/BotService.ts
import { createClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MeetingBotSettings, BotSession, MeetingInfo } from './types'

export class MeetingBotService {
  private supabase: SupabaseClient
  private activeBots: Map<string, WorkspaceBot> = new Map()

  constructor() {
    this.supabase = createClient()
  }

  async startBotForWorkspace(
    workspaceId: string, 
    settings: MeetingBotSettings
  ): Promise<WorkspaceBot> {
    console.log(`🤖 Starting bot for workspace: ${workspaceId}`)
    
    // Check if workspace has Google Calendar connected
    const calendarIntegration = await this.getCalendarIntegration(workspaceId)
    
    if (!calendarIntegration) {
      throw new Error('Google Calendar not connected for this workspace')
    }

    // Start monitoring calendar
    const bot = new WorkspaceBot(workspaceId, settings, this.supabase)
    await bot.initialize()
    
    this.activeBots.set(workspaceId, bot)
    
    return bot
  }

  async stopBotForWorkspace(workspaceId: string): Promise<void> {
    const bot = this.activeBots.get(workspaceId)
    if (bot) {
      await bot.shutdown()
      this.activeBots.delete(workspaceId)
    }
  }

  async getActiveSessions(workspaceId: string): Promise<BotSession[]> {
    const { data, error } = await this.supabase
      .from('meeting_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')

    if (error) throw error
    return data || []
  }

  private async getCalendarIntegration(workspaceId: string) {
    const { data } = await this.supabase
      .from('workspace_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('type', 'google_calendar')
      .maybeSingle()

    return data
  }
}

class WorkspaceBot {
  private intervalId?: NodeJS.Timeout

  constructor(
    private workspaceId: string,
    private settings: MeetingBotSettings,
    private supabase: SupabaseClient
  ) {}

  async initialize(): Promise<void> {
    console.log(`🔧 Initializing bot for workspace: ${this.workspaceId}`)
    
    // Start calendar monitoring
    this.intervalId = setInterval(() => {
      this.checkUpcomingMeetings().catch(console.error)
    }, 60000) // Check every minute
  }

  async shutdown(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    console.log(`🛑 Bot shut down for workspace: ${this.workspaceId}`)
  }

  private async checkUpcomingMeetings(): Promise<void> {
    try {
      const meetings = await this.getWorkspaceMeetings()
      
      for (const meeting of meetings) {
        if (this.shouldJoinMeeting(meeting)) {
          await this.joinMeeting(meeting)
        }
      }
    } catch (error) {
      console.error('Error checking meetings:', error)
    }
  }

  private async getWorkspaceMeetings(): Promise<MeetingInfo[]> {
    // TODO: Integrate with your existing calendar system
    // This would use the same Google Calendar API you already have
    return []
  }

  private shouldJoinMeeting(meeting: MeetingInfo): boolean {
    const now = new Date()
    const joinTime = new Date(
      meeting.startTime.getTime() - (this.settings.joinBeforeMinutes * 60 * 1000)
    )
    
    return now >= joinTime && now <= meeting.startTime
  }

  private async joinMeeting(meeting: MeetingInfo): Promise<void> {
    console.log(`🎯 Joining meeting: ${meeting.title}`)
    
    try {
      // Log meeting session start
      const { data, error } = await this.supabase
        .from('meeting_sessions')
        .insert({
          workspace_id: this.workspaceId,
          meeting_id: meeting.id,
          meeting_title: meeting.title,
          meeting_url: meeting.url,
          platform: meeting.platform,
          status: 'joining',
          join_time: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // TODO: Implement actual bot joining logic here
      // This would use the Zoom/Teams/Meet bot classes
      
    } catch (error) {
      console.error(`Failed to join meeting ${meeting.title}:`, error)
      
      // Log error to database
      await this.supabase
        .from('meeting_sessions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('meeting_id', meeting.id)
    }
  }
}
