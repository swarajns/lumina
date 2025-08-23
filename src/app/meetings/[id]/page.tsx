'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import CustomAudioPlayer from '@/components/AudioPlayer'
import SyncedTranscript from '@/components/SyncedTranscript'
import MeetingNotes from '@/components/MeetingNotes'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileAudio, 
  FileVideo, 
  Download, 
  Upload,
  Mic,
  CheckCircle,
  Circle,
  Tag,
  Edit,
  Save,
  X,
  Trash2,
  Copy,
  Share,
  Volume2,
  PlayCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatFileSize, formatDuration, formatRelativeTime } from '@/lib/utils'
import type { Meeting, ActionItem, KeyPoint } from '@/lib/supabase'

interface MeetingWithDetails extends Meeting {
  action_items: ActionItem[]
  key_points: KeyPoint[]
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string

  const [meeting, setMeeting] = useState<MeetingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    if (meetingId) {
      fetchMeeting()
    }
  }, [meetingId])

  const fetchMeeting = async () => {
    try {
      setLoading(true)
      
      const { data: meetingData, error } = await supabase
        .from('meetings')
        .select(`
          *,
          action_items (*),
          key_points (*)
        `)
        .eq('id', meetingId)
        .single()

      if (error) {
        console.error('Error fetching meeting:', error)
        router.push('/meetings')
        return
      }

      setMeeting(meetingData)
      setNewTitle(meetingData.title || '')
    } catch (error) {
      console.error('Error fetching meeting:', error)
      router.push('/meetings')
    } finally {
      setLoading(false)
    }
  }

  const toggleActionItem = async (actionItemId: string) => {
    if (!meeting) return

    try {
      const actionItem = meeting.action_items.find(ai => ai.id === actionItemId)
      if (!actionItem) return

      const { error } = await supabase
        .from('action_items')
        .update({ completed: !actionItem.completed })
        .eq('id', actionItemId)

      if (error) throw error

      setMeeting(prev => prev ? {
        ...prev,
        action_items: prev.action_items.map(item =>
          item.id === actionItemId ? { ...item, completed: !item.completed } : item
        )
      } : null)
    } catch (error) {
      console.error('Error updating action item:', error)
    }
  }

  const updateMeetingTitle = async () => {
    if (!meeting || !newTitle.trim()) return

    try {
      const { error } = await supabase
        .from('meetings')
        .update({ title: newTitle.trim() })
        .eq('id', meeting.id)

      if (error) throw error

      setMeeting(prev => prev ? { ...prev, title: newTitle.trim() } : null)
      setEditingTitle(false)
    } catch (error) {
      console.error('Error updating title:', error)
    }
  }

  const deleteMeeting = async () => {
    if (!meeting) return
    
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meeting.id)

      if (error) throw error

      router.push('/meetings')
    } catch (error) {
      console.error('Error deleting meeting:', error)
      alert('Failed to delete meeting. Please try again.')
    }
  }

  const downloadTranscript = () => {
    if (!meeting) return

    const content = `
Meeting: ${meeting.title}
Date: ${new Date(meeting.created_at).toLocaleDateString()}
Duration: ${formatDuration(meeting.duration)}
Source: ${meeting.source === 'upload' ? 'Uploaded' : 'Recorded'}

SUMMARY:
${meeting.summary}

KEY POINTS:
${meeting.key_points.map(point => `• ${point.text}`).join('\n')}

ACTION ITEMS:
${meeting.action_items.map(item => `${item.completed ? '✅' : '❌'} ${item.text} (${item.priority} priority)`).join('\n')}

FULL TRANSCRIPT:
${meeting.transcript}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meeting.title || 'Meeting'}-transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyTranscript = async () => {
    if (!meeting?.transcript) return
    
    try {
      await navigator.clipboard.writeText(meeting.transcript)
      alert('Transcript copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy transcript:', error)
    }
  }

  const shareUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('Meeting URL copied to clipboard!')
    }).catch(() => {
      alert(`Meeting URL: ${url}`)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Meeting Not Found</h1>
            <Button onClick={() => router.push('/meetings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Meetings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const SourceIcon = meeting.source === 'upload' ? Upload : Mic
  const FileIcon = meeting.mime_type?.startsWith('video/') ? FileVideo : FileAudio
  const completedActions = meeting.action_items.filter(item => item.completed).length
  const totalActions = meeting.action_items.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/meetings')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-3xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-3 py-1 flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && updateMeetingTitle()}
                  />
                  <Button size="sm" onClick={updateMeetingTitle}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {meeting.title || 'Untitled Meeting'}
                  </h1>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTitle(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-6 mt-3 text-gray-600">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {new Date(meeting.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {formatDuration(meeting.duration)}
                </span>
                <span className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5" />
                  {formatFileSize(meeting.file_size || 0)}
                </span>
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  meeting.source === 'upload' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  <SourceIcon className="h-4 w-4" />
                  {meeting.source === 'upload' ? 'Uploaded' : 'Recorded'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={shareUrl}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={downloadTranscript}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={deleteMeeting} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Professional Audio Player */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomAudioPlayer
                  src={meeting.file_url || ''}
                  title={meeting.title || 'Meeting Recording'}
                  onPlay={() => console.log('Playing:', meeting.title)}
                  onPause={() => console.log('Paused:', meeting.title)}
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>File: {meeting.mime_type}</span>
                    <span>Size: {formatFileSize(meeting.file_size || 0)}</span>
                    <span>Duration: {formatDuration(meeting.duration)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Synchronized Transcript */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Interactive Transcript
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={copyTranscript}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SyncedTranscript
                  transcript={meeting.transcript}
                  audioUrl={meeting.file_url || ''}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card>
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {meeting.summary}
                </p>
              </CardContent>
            </Card>

            {/* Full Transcript (Static) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Full Transcript</CardTitle>
                  <Button variant="outline" size="sm" onClick={copyTranscript}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {meeting.transcript}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Action Items</span>
                  {totalActions > 0 && (
                    <span className="text-sm text-gray-600">
                      {completedActions}/{totalActions}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meeting.action_items.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No action items identified
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%` }}
                      />
                    </div>

                    {meeting.action_items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
                          item.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <button
                          onClick={() => toggleActionItem(item.id)}
                          className={`mt-0.5 transition-colors ${
                            item.completed 
                              ? 'text-green-600' 
                              : 'text-gray-400 hover:text-primary-600'
                          }`}
                        >
                          {item.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            item.completed ? 'line-through text-gray-600' : 'text-gray-900'
                          }`}>
                            {item.text}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            item.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : item.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.priority} priority
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Points */}
            <Card>
              <CardHeader>
                <CardTitle>Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                {meeting.key_points.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No key points identified
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {meeting.key_points.map((point) => (
                      <li key={point.id} className="flex items-start gap-3">
                        <span className="text-primary-600 mt-1 flex-shrink-0">•</span>
                        <span className="text-gray-700 text-sm leading-relaxed">
                          {point.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Meeting Notes - NEW FEATURE */}
            <MeetingNotes 
              meetingId={meeting.id}
              className="w-full"
            />

            {/* Meeting Info */}
            <Card>
              <CardHeader>
                <CardTitle>Meeting Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatRelativeTime(meeting.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="text-gray-900">{formatDuration(meeting.duration)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">File Size:</span>
                  <span className="text-gray-900">{formatFileSize(meeting.file_size || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Format:</span>
                  <span className="text-gray-900">{meeting.mime_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Source:</span>
                  <span className="text-gray-900">
                    {meeting.source === 'upload' ? 'Uploaded' : 'Recorded'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
