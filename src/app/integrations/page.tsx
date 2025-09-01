'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function IntegrationsPage() {
  const [isGoogleConnected, setGoogleConnected] = useState(false)

  // TODO: fetch actual connection status from API on mount
  useEffect(() => {
    // Fetch and update connection statuses here
    setGoogleConnected(false) // initially false
  }, [])

  const connectGoogleCalendar = () => {
    window.location.href = '/api/integrations/google/start'
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="mb-8 text-2xl font-bold">Integrations</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Google Calendar</h2>
            <p className="text-sm text-gray-600">Sync your calendar to enable auto meeting scheduling and bot functionality.</p>
          </div>
          {isGoogleConnected ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle />
              <span>Connected</span>
            </div>
          ) : (
            <Button onClick={connectGoogleCalendar} className="bg-blue-600 text-white">
              Connect Google Calendar
            </Button>
          )}
        </div>

        {/* Similarly, add Zoom integration here */}
      </div>
    </div>
  )
}
