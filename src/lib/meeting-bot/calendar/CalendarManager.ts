import { google } from 'googleapis'
import type { CalendarEvent } from '../types'

export class CalendarManager {
  private calendar: any
  private auth: any

  async initialize() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: './config/google-service-account.json',
      scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    })
    
    this.calendar = google.calendar({ version: 'v3', auth: this.auth })
  }

  async getUpcomingMeetings(): Promise<CalendarEvent[]> {
    const authClient = await this.auth.getClient()
    
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    
    const response = await this.calendar.events.list({
      auth: authClient,
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    })

    return response.data.items || []
  }
}
