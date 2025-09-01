// src/app/teams/components/MeetingBotSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bot, Calendar, Settings, Play, Pause } from "lucide-react"
import { toast } from 'sonner'
import type { MeetingBotSettings as BotSettings, BotSession } from '@/lib/meeting-bot/types'

interface MeetingBotSettingsProps {
  workspaceId: string
}

export default function MeetingBotSettings({ workspaceId }: MeetingBotSettingsProps) {
  const [botSettings, setBotSettings] = useState<BotSettings>({
    enabled: false,
    autoJoin: true,
    recordMeetings: true,
    transcribeAudio: true,
    joinBeforeMinutes: 2,
    leaveAfterMinutes: 5
  })

  const [activeSessions, setActiveSessions] = useState<BotSession[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const saveBotSettings = async (): Promise<void> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/meeting-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          settings: botSettings
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      toast.success('Bot settings saved successfully!')
      
      // Refresh active sessions
      await fetchActiveSessions()
      
    } catch (error) {
      console.error('Error saving bot settings:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActiveSessions = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/meeting-bot?workspaceId=${workspaceId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setActiveSessions(data.sessions || [])
      
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const leaveMeeting = async (sessionId: string): Promise<void> => {
    // TODO: Implement leave meeting functionality
    toast.info('Leave meeting functionality coming soon!')
  }

  useEffect(() => {
    fetchActiveSessions()
    
    // Refresh sessions every 30 seconds
    const interval = setInterval(fetchActiveSessions, 30000)
    return () => clearInterval(interval)
  }, [workspaceId])

  return (
    <div className="space-y-6">
      {/* Your existing JSX remains the same, just with proper TypeScript types */}
      <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-blue-600" />
            Auto-Join Meeting Bot
            <Badge className={`ml-auto ${botSettings.enabled ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'}`}>
              {botSettings.enabled ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rest of your component JSX... */}
          <Button 
            onClick={saveBotSettings}
            disabled={isLoading}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Bot Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
