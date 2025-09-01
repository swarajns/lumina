// src/lib/meeting-bot/types.ts
export interface MeetingBotSettings {
  enabled: boolean
  autoJoin: boolean
  recordMeetings: boolean
  transcribeAudio: boolean
  joinBeforeMinutes: number
  leaveAfterMinutes: number
  botName?: string
}

export interface MeetingInfo {
  id: string
  platform: 'zoom' | 'teams' | 'googlemeet'
  url: string
  password?: string
  title: string
  startTime: Date
  endTime: Date
}

export interface BotSession {
  id: string
  meetingId: string
  meetingTitle: string
  platform: string
  url: string
  joinTime: Date
  endTime?: Date
  status: 'joining' | 'active' | 'completed' | 'failed'
  workspaceId: string
  recordingUrl?: string
  transcript?: string
  aiSummary?: string
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    responseStatus: string
  }>
}
