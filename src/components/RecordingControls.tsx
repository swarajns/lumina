'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Mic, Video, Monitor, Square, Play, Pause } from 'lucide-react'
import { RecordingManager } from '@/lib/recording'
import { formatDuration } from '@/lib/utils'
import type { RecordingState } from '@/types'

interface RecordingControlsProps {
  onRecordingComplete: (blob: Blob, duration: number, title: string) => void
}

export default function RecordingControls({ onRecordingComplete }: RecordingControlsProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    mode: 'audio',
    hasAudio: true,
    hasWebcam: false
  })

  const [meetingTitle, setMeetingTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking')
  const recordingManager = useRef<RecordingManager>(new RecordingManager())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Timer effect
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [recordingState.isRecording, recordingState.isPaused])

  // Check permissions when mode changes
  useEffect(() => {
    checkPermissions()
  }, [recordingState.mode])

  const checkPermissions = async () => {
    try {
      setPermissionStatus('checking')
      
      let permission: PermissionState = 'granted'
      
      if (recordingState.mode === 'audio' || recordingState.mode === 'video') {
        const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        permission = audioPermission.state
        
        if (recordingState.mode === 'video') {
          const videoPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          if (videoPermission.state === 'denied') permission = 'denied'
        }
      }
      
      setPermissionStatus(permission)
    } catch (error) {
      console.log('Permission check not supported, will check on recording start')
      setPermissionStatus('prompt')
    }
  }

  const handleStartRecording = async () => {
    try {
      setError(null)
      await recordingManager.current.startRecording(recordingState.mode, {
        hasAudio: recordingState.hasAudio,
        hasWebcam: recordingState.hasWebcam
      })
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0
      }))
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      setError(error.message || 'Failed to start recording')
      
      // Check for specific permission errors
      if (error.message?.includes('denied') || error.message?.includes('permission')) {
        setPermissionStatus('denied')
      }
    }
  }

  const handleStopRecording = async () => {
    try {
      const blob = await recordingManager.current.stopRecording()
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false
      }))
      
      // Pass title, duration, and blob to the completion handler
      onRecordingComplete(blob, recordingState.duration, meetingTitle || 'Untitled Meeting')
    } catch (error: any) {
      console.error('Failed to stop recording:', error)
      setError(error.message || 'Failed to stop recording')
    }
  }

  const handlePauseResume = () => {
    if (recordingState.isPaused) {
      recordingManager.current.resumeRecording()
      setRecordingState(prev => ({ ...prev, isPaused: false }))
    } else {
      recordingManager.current.pauseRecording()
      setRecordingState(prev => ({ ...prev, isPaused: true }))
    }
  }

  const handleModeChange = (mode: 'audio' | 'video' | 'screen') => {
    if (!recordingState.isRecording) {
      setRecordingState(prev => ({ ...prev, mode }))
      setError(null)
    }
  }

  const toggleAudio = () => {
    if (!recordingState.isRecording) {
      setRecordingState(prev => ({ ...prev, hasAudio: !prev.hasAudio }))
    }
  }

  const toggleWebcam = () => {
    if (!recordingState.isRecording && recordingState.mode === 'screen') {
      setRecordingState(prev => ({ ...prev, hasWebcam: !prev.hasWebcam }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Recording Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Recording Mode</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
              {permissionStatus === 'denied' && (
                <p className="text-red-700 text-xs mt-1">
                  Please allow microphone/camera access in your browser settings and refresh the page.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={recordingState.mode === 'audio' ? 'default' : 'outline'}
              onClick={() => handleModeChange('audio')}
              disabled={recordingState.isRecording}
              className="flex flex-col h-20 space-y-2"
            >
              <Mic className="h-6 w-6" />
              <span className="text-sm">Audio Only</span>
            </Button>
            
            <Button
              variant={recordingState.mode === 'video' ? 'default' : 'outline'}
              onClick={() => handleModeChange('video')}
              disabled={recordingState.isRecording}
              className="flex flex-col h-20 space-y-2"
            >
              <Video className="h-6 w-6" />
              <span className="text-sm">Video</span>
            </Button>
            
            <Button
              variant={recordingState.mode === 'screen' ? 'default' : 'outline'}
              onClick={() => handleModeChange('screen')}
              disabled={recordingState.isRecording}
              className="flex flex-col h-20 space-y-2"
            >
              <Monitor className="h-6 w-6" />
              <span className="text-sm">Screen</span>
            </Button>
          </div>

          {/* Screen Recording Options */}
          {recordingState.mode === 'screen' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Include Audio</span>
                <Button
                  variant={recordingState.hasAudio ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleAudio}
                  disabled={recordingState.isRecording}
                >
                  {recordingState.hasAudio ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Webcam Overlay</span>
                <Button
                  variant={recordingState.hasWebcam ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleWebcam}
                  disabled={recordingState.isRecording}
                >
                  {recordingState.hasWebcam ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          )}

          {/* Permission Status */}
          {permissionStatus === 'checking' && (
            <div className="mt-3 text-sm text-gray-500">
              Checking permissions...
            </div>
          )}
          {permissionStatus === 'denied' && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Permission denied. Please allow access and refresh.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title... (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={recordingState.isRecording}
              />
              <p className="text-xs text-gray-500 mt-1">
                {meetingTitle.trim() ? `Title: "${meetingTitle.trim()}"` : 'Will use "Untitled Meeting" if left empty'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle>
            {recordingState.isRecording ? 'Recording In Progress' : 'Ready to Record'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Duration Display */}
            {recordingState.isRecording && (
              <div className="text-center">
                <div className="text-3xl font-mono text-primary-600">
                  {formatDuration(recordingState.duration)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {recordingState.isPaused ? 'Paused' : 'Recording...'}
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center space-x-3">
              {!recordingState.isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                  disabled={permissionStatus === 'denied'}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    <span>Start Recording</span>
                  </div>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handlePauseResume}
                    variant="outline"
                    size="lg"
                  >
                    {recordingState.isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleStopRecording}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                </>
              )}
            </div>

            {/* Recording Info */}
            {!recordingState.isRecording && (
              <div className="text-center text-sm text-gray-500">
                <p>Click "Start Recording" to begin capturing audio</p>
                <p className="mt-1">
                  Mode: <span className="font-medium capitalize">{recordingState.mode}</span>
                  {meetingTitle.trim() && (
                    <> • Title: <span className="font-medium">"{meetingTitle.trim()}"</span></>
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
