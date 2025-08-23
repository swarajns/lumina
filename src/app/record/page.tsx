'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import UpgradePrompt from '@/components/UpgradePrompt'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import { 
  Mic, 
  Square, 
  Upload as UploadIcon, 
  Clock,
  Users,
  Crown,
  Zap
} from 'lucide-react'

export default function RecordPage() {
  const router = useRouter()
  const { limits, loading } = useSubscriptionLimits()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
        
        // Check if Free user exceeds 30 minutes
        if (limits.planName === 'Free' && recordingTime >= 1800) { // 30 minutes
          stopRecording()
          alert('Free plan recording limit reached (30 minutes). Upgrade to Pro for unlimited recording time.')
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, recordingTime, limits.planName])

  const startRecording = async () => {
    // Check limits before starting
    if (!limits.canRecord) {
      return // Let the UI show the upgrade prompt
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      
      mediaRecorder.ondataavailable = (event) => {
        const audioBlob = event.data
        // Handle the recorded audio blob
        console.log('Recording completed:', audioBlob)
        
        // Here you would typically upload and process the audio
        // For now, just redirect to processing page or show success
        router.push('/meetings')
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (limits.planName === 'Free') {
      const remaining = 1800 - recordingTime // 30 minutes for Free
      if (remaining < 300) return 'text-red-600' // Last 5 minutes
      if (remaining < 600) return 'text-orange-600' // Last 10 minutes
    }
    return 'text-gray-900'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show upgrade prompt if at limit
  if (!limits.canRecord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Recording Limit Reached
            </h1>
            <p className="text-gray-600">
              You've used all your meetings for this month. Upgrade to continue recording.
            </p>
          </div>

          <UpgradePrompt
            title="Upgrade to Continue Recording"
            description="Get unlimited meetings, longer recordings, and AI-powered analysis with our Pro plan."
            reason={limits.upgradeReason || undefined}
            ctaText="Upgrade to Pro"
            variant="blocking"
            className="max-w-2xl mx-auto"
          />

          {/* Show what they're missing */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-6">
              What you'll get with Pro:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900">50 meetings per month</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900">Unlimited recording time</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900">AI summaries & action items</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Crown className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900">Advanced search & export</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Record Meeting
          </h1>
          <p className="text-gray-600">
            Record your meeting and get AI-powered transcription and analysis
          </p>
          
          {/* Usage indicator for current plan */}
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
            <span className="text-sm text-gray-600">
              {limits.planName} Plan: {limits.currentMeetings}/{limits.maxMeetings === -1 ? '∞' : limits.maxMeetings} meetings used
            </span>
            {limits.isNearLimit && (
              <Crown className="h-4 w-4 text-orange-500" />
            )}
          </div>
        </div>

        {/* Near limit warning */}
        {limits.isNearLimit && !limits.isAtLimit && (
          <div className="mb-8">
            <UpgradePrompt
              title="Approaching Your Limit"
              description="You're running low on meetings this month. Upgrade to Pro for unlimited recordings."
              reason={limits.upgradeReason || undefined}
              variant="warning"
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Recording Interface */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Mic className={isRecording ? 'h-6 w-6 text-red-600 animate-pulse' : 'h-6 w-6 text-primary-600'} />
              {isRecording ? 'Recording in Progress' : 'Ready to Record'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            {/* Recording Timer */}
            <div className="text-6xl font-bold font-mono">
              <span className={getTimeColor()}>
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Free plan time limit indicator */}
            {limits.planName === 'Free' && (
              <div className="text-sm text-gray-600">
                <span>Recording limit: 30 minutes</span>
                {isRecording && (
                  <span className="ml-2">
                    ({formatTime(1800 - recordingTime)} remaining)
                  </span>
                )}
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex gap-4 justify-center">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={!limits.canRecord}
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => router.push('/upload')}
                size="lg"
                disabled={!limits.canUpload}
              >
                <UploadIcon className="h-5 w-5 mr-2" />
                Upload Instead
              </Button>
            </div>

            {/* Recording Tips */}
            <div className="text-sm text-gray-600 text-left">
              <h4 className="font-semibold mb-2">Recording Tips:</h4>
              <ul className="space-y-1">
                <li>• Ensure good microphone quality for best transcription</li>
                <li>• Speak clearly and avoid background noise</li>
                <li>• The recording will be processed after you stop</li>
                {limits.planName === 'Free' && (
                  <li className="text-orange-600 font-medium">• Free plan: 30 minute recording limit</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Or try these quick actions:
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/meetings')}
            >
              View Past Meetings
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/pricing')}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
