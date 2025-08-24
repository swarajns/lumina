'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CustomAudioPlayer from '@/components/AudioPlayer'
import AdvancedSearch from '@/components/AdvancedSearch'
import { 
  Calendar, 
  Clock, 
  FileAudio, 
  FileVideo, 
  Download, 
  Play, 
  Upload,
  Mic,
  MoreVertical,
  Trash2,
  CheckCircle,
  Circle,
  Tag,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatFileSize, formatDuration } from '@/lib/utils'
import type { Meeting, ActionItem, KeyPoint } from '@/lib/supabase'

interface MeetingWithDetails extends Meeting {
  action_items: ActionItem[]
  key_points: KeyPoint[]
}

interface SearchFilters {
  query: string
  source: 'all' | 'record' | 'upload'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  actionItemsStatus: 'all' | 'complete' | 'incomplete' | 'none'
  customDateStart?: string
  customDateEnd?: string
}

export default function MeetingsPage() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithDetails | null>(null)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  // Fetch meetings from Supabase with advanced search
  const fetchMeetings = useCallback(async (filters?: SearchFilters) => {
    try {
      setSearchLoading(true)
      
      let query = supabase
        .from('meetings')
        .select(`
          *,
          action_items (*),
          key_points (*)
        `)
        .order('created_at', { ascending: false })

      // Apply full-text search if query exists
      if (filters?.query && filters.query.trim()) {
        const searchTerms = filters.query.trim().split(/\s+/).join(' | ')
        query = query.textSearch('fts', searchTerms)
      }

      // Apply source filter
      if (filters?.source && filters.source !== 'all') {
        query = query.eq('source', filters.source)
      }

      // Apply date range filter
      if (filters?.dateRange && filters.dateRange !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(0)
        }

        query = query.gte('created_at', startDate.toISOString())
      }

      const { data: meetingsData, error: meetingsError } = await query

      if (meetingsError) throw meetingsError

      let filteredMeetings = meetingsData || []

      // Apply action items filter (client-side for complex logic)
      if (filters?.actionItemsStatus && filters.actionItemsStatus !== 'all') {
        filteredMeetings = filteredMeetings.filter(meeting => {
          const hasActionItems = meeting.action_items.length > 0
          const completedCount = meeting.action_items.filter(item => item.completed).length
          const allCompleted = hasActionItems && completedCount === meeting.action_items.length

          switch (filters.actionItemsStatus) {
            case 'complete':
              return hasActionItems && allCompleted
            case 'incomplete':
              return hasActionItems && !allCompleted
            case 'none':
              return !hasActionItems
            default:
              return true
          }
        })
      }

      setMeetings(filteredMeetings)
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const handleSearch = useCallback((filters: SearchFilters) => {
    fetchMeetings(filters)
  }, [fetchMeetings])

  const handleClearSearch = useCallback(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const toggleActionItem = async (meetingId: string, actionItemId: string) => {
    try {
      const meeting = meetings.find(m => m.id === meetingId)
      const actionItem = meeting?.action_items.find(ai => ai.id === actionItemId)
      
      if (!actionItem) return

      const { error } = await supabase
        .from('action_items')
        .update({ completed: !actionItem.completed })
        .eq('id', actionItemId)

      if (error) throw error

      // Update local state
      setMeetings(prev => prev.map(meeting => ({
        ...meeting,
        action_items: meeting.action_items.map(item =>
          item.id === actionItemId ? { ...item, completed: !item.completed } : item
        )
      })))

      // Update selected meeting if it's open
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(prev => prev ? {
          ...prev,
          action_items: prev.action_items.map(item =>
            item.id === actionItemId ? { ...item, completed: !item.completed } : item
          )
        } : null)
      }
    } catch (error) {
      console.error('Error updating action item:', error)
    }
  }

  const deleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (error) throw error

      setMeetings(prev => prev.filter(m => m.id !== meetingId))
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null)
      }
      // Close expanded player if it was this meeting
      if (expandedPlayer === meetingId) {
        setExpandedPlayer(null)
      }
    } catch (error) {
      console.error('Error deleting meeting:', error)
      alert('Failed to delete meeting. Please try again.')
    }
  }

  const downloadTranscript = (meeting: MeetingWithDetails) => {
    const content = `
Meeting: ${meeting.title}
Date: ${new Date(meeting.created_at).toLocaleDateString()}
Duration: ${formatDuration(meeting.duration)}

TRANSCRIPT:
${meeting.transcript}

SUMMARY:
${meeting.summary}

KEY POINTS:
${meeting.key_points.map(point => `• ${point.text}`).join('\n')}

ACTION ITEMS:
${meeting.action_items.map(item => `${item.completed ? '✅' : '❌'} ${item.text} (${item.priority} priority)`).join('\n')}
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

  const toggleAudioPlayer = (meetingId: string) => {
    setExpandedPlayer(expandedPlayer === meetingId ? null : meetingId)
  }

  const getSourceIcon = (source: string) => {
    return source === 'upload' ? Upload : Mic
  }

  const getSourceLabel = (source: string) => {
    return source === 'upload' ? 'Uploaded' : 'Recorded'
  }

  const getFileIcon = (mimeType: string) => {
    return mimeType?.startsWith('video/') ? FileVideo : FileAudio
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meeting History
          </h1>
          <p className="text-gray-600">
            Search and manage all your recorded and uploaded meetings
          </p>
        </div>

        {/* Advanced Search Component */}
        <AdvancedSearch 
          onSearch={handleSearch}
          onClear={handleClearSearch}
          totalResults={meetings.length}
          isLoading={searchLoading}
        />

        {/* Meetings Grid */}
        {meetings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileAudio className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No meetings found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or filters, or start by recording a new meeting
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push('/record')}>
                  <Mic className="h-4 w-4 mr-2" />
                  Record Meeting
                </Button>
                <Button variant="outline" onClick={() => router.push('/upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => {
              const SourceIcon = getSourceIcon(meeting.source || 'record')
              const FileIcon = getFileIcon(meeting.mime_type || '')
              const completedActions = meeting.action_items.filter(item => item.completed).length
              const totalActions = meeting.action_items.length
              const isPlayerExpanded = expandedPlayer === meeting.id

              return (
                <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 line-clamp-2">
                          {meeting.title || 'Untitled Meeting'}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <SourceIcon className="h-4 w-4" />
                          <span>{getSourceLabel(meeting.source || 'record')}</span>
                          <span className={`px-2 py-1 rounded-full text-xs border ${
                            meeting.source === 'upload' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            <Tag className="h-3 w-3 inline mr-1" />
                            {getSourceLabel(meeting.source || 'record')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMeeting(meeting)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Meeting Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(meeting.duration)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileIcon className="h-4 w-4" />
                          <span>{formatFileSize(meeting.file_size || 0)}</span>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {meeting.summary}
                      </p>

                      {/* Action Items Progress */}
                      {totalActions > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Actions:</span>
                          <span className={`font-medium ${
                            completedActions === totalActions ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {completedActions}/{totalActions} completed
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{ width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/meetings/${meeting.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAudioPlayer(meeting.id)}
                        >
                          {isPlayerExpanded ? <ChevronUp className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadTranscript(meeting)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Expandable Professional Audio Player */}
                      {isPlayerExpanded && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 text-sm mb-1">
                              Now Playing: {meeting.title || 'Untitled Meeting'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDuration(meeting.duration)} • {formatFileSize(meeting.file_size || 0)}
                            </p>
                          </div>
                          <CustomAudioPlayer
                            src={meeting.file_url || ''}
                            title=""
                            onPlay={() => console.log('Playing:', meeting.title)}
                            className="w-full"
                          />
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedPlayer(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Collapse
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Meeting Details Modal */}
        {selectedMeeting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedMeeting.title || 'Untitled Meeting'}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedMeeting.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(selectedMeeting.duration)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        selectedMeeting.source === 'upload' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {getSourceLabel(selectedMeeting.source || 'record')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/meetings/${selectedMeeting.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Page
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTranscript(selectedMeeting)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => deleteMeeting(selectedMeeting.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedMeeting(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Professional Audio Player in Modal */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Audio Playback</h3>
                  <CustomAudioPlayer
                    src={selectedMeeting.file_url || ''}
                    title={selectedMeeting.title || 'Meeting Recording'}
                    onPlay={() => console.log('Modal player started:', selectedMeeting.title)}
                  />
                </div>

                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedMeeting.summary}
                  </p>
                </div>

                {/* Action Items */}
                {selectedMeeting.action_items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Action Items ({selectedMeeting.action_items.filter(item => item.completed).length}/{selectedMeeting.action_items.length} completed)
                    </h3>
                    <div className="space-y-2">
                      {selectedMeeting.action_items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg ${
                            item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <button
                            onClick={() => toggleActionItem(selectedMeeting.id, item.id)}
                            className={`transition-colors ${
                              item.completed ? 'text-green-600' : 'text-gray-400 hover:text-primary-600'
                            }`}
                          >
                            {item.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                          </button>
                          <span className={`flex-1 ${item.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                            {item.text}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {selectedMeeting.key_points.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
                    <ul className="space-y-2">
                      {selectedMeeting.key_points.map((point) => (
                        <li key={point.id} className="flex items-start gap-2 text-gray-700">
                          <span className="text-primary-600 mt-1">•</span>
                          <span>{point.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Full Transcript */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Transcript</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedMeeting.transcript}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
