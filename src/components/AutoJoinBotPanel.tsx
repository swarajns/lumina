// src/app/meetings/components/AutoJoinBotPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Calendar, Settings, Activity } from "lucide-react"

export default function AutoJoinBotPanel() {
  const [botEnabled, setBotEnabled] = useState(false)
  const [activeMeetings, setActiveMeetings] = useState([])

  return (
    <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-blue-600" />
          Auto-Join Meeting Bot
          <Badge className={`ml-auto ${botEnabled ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'}`}>
            {botEnabled ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-black">Enable Auto-Join</h4>
            <p className="text-sm text-black/70">Automatically join meetings from your calendar</p>
          </div>
          <Switch
            checked={botEnabled}
            onCheckedChange={setBotEnabled}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>

        {botEnabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-black">Auto-record meetings</span>
              <Switch className="data-[state=checked]:bg-green-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-black">AI transcription</span>
              <Switch className="data-[state=checked]:bg-purple-500" />
            </div>

            <Button className="w-full bg-black text-white hover:bg-gray-800">
              <Settings className="h-4 w-4 mr-2" />
              Configure Bot Settings
            </Button>
          </div>
        )}

        {/* Active Meetings */}
        <div className="space-y-2">
          <h4 className="font-medium text-black flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Active Sessions ({activeMeetings.length})
          </h4>
          {activeMeetings.length === 0 ? (
            <p className="text-sm text-black/70">No active meeting sessions</p>
          ) : (
            activeMeetings.map((meeting: any) => (
              <div key={meeting.id} className="flex items-center justify-between p-2 bg-black/5 rounded">
                <span className="text-sm">{meeting.title}</span>
                <Badge className="bg-green-500/20 text-green-700">Live</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
