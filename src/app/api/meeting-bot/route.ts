// src/app/api/meeting-bot/route.ts
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { MeetingBotService } from '@/lib/meeting-bot/BotService'
import type { MeetingBotSettings } from '@/lib/meeting-bot/types'

const botService = new MeetingBotService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, settings }: { workspaceId: string; settings: MeetingBotSettings } = body
    
    if (!workspaceId || !settings) {
      return NextResponse.json(
        { error: 'Missing workspaceId or settings' }, 
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Save bot settings to database
    const { error } = await supabase
      .from('workspace_settings')
      .upsert({
        workspace_id: workspaceId,
        meeting_bot_enabled: settings.enabled,
        bot_settings: settings
      })

    if (error) throw error

    // Start/stop bot based on settings
    if (settings.enabled) {
      await botService.startBotForWorkspace(workspaceId, settings)
    } else {
      await botService.stopBotForWorkspace(workspaceId)
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Meeting bot API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' }, 
        { status: 400 }
      )
    }

    const sessions = await botService.getActiveSessions(workspaceId)
    
    return NextResponse.json({ sessions })
    
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    )
  }
}
