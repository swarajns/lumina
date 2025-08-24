'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  Mic, 
  Upload, 
  CheckSquare, 
  TrendingUp,
  FileAudio,
  Users,
  BarChart3,
  ArrowRight,
  Target,
  Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDuration } from '@/lib/utils'

interface DashboardData {
  totalMeetings: number
  totalDuration: number
  totalActionItems: number
  completedActionItems: number
  recordedMeetings: number
  uploadedMeetings: number
  thisWeekMeetings: number
  averageMeetingLength: number
  recentMeetings: any[]
  weeklyStats: { day: string; meetings: number }[]
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData>({
    totalMeetings: 0,
    totalDuration: 0,
    totalActionItems: 0,
    completedActionItems: 0,
    recordedMeetings: 0,
    uploadedMeetings: 0,
    thisWeekMeetings: 0,
    averageMeetingLength: 0,
    recentMeetings: [],
    weeklyStats: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all meetings with related data
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          *,
          action_items (*),
          key_points (*)
        `)
        .order('created_at', { ascending: false })

      if (meetingsError) throw meetingsError

      // Calculate statistics
      const totalMeetings = meetings?.length || 0
      const totalDuration = meetings?.reduce((sum, m) => sum + (m.duration || 0), 0) || 0
      const allActionItems = meetings?.flatMap(m => m.action_items) || []
      const totalActionItems = allActionItems.length
      const completedActionItems = allActionItems.filter(ai => ai.completed).length
      const recordedMeetings = meetings?.filter(m => m.source === 'record').length || 0
      const uploadedMeetings = meetings?.filter(m => m.source === 'upload').length || 0
      
      // This week's meetings
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const thisWeekMeetings = meetings?.filter(m => 
        new Date(m.created_at) >= oneWeekAgo
      ).length || 0

      const averageMeetingLength = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0

      // Recent meetings (last 5)
      const recentMeetings = meetings?.slice(0, 5) || []

      // Weekly stats for chart
      const weeklyStats = generateWeeklyStats(meetings || [])

      setData({
        totalMeetings,
        totalDuration,
        totalActionItems,
        completedActionItems,
        recordedMeetings,
        uploadedMeetings,
        thisWeekMeetings,
        averageMeetingLength,
        recentMeetings,
        weeklyStats
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyStats = (meetings: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const weekStats = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]
      
      const meetingsOnDay = meetings.filter(m => {
        const meetingDate = new Date(m.created_at)
        return meetingDate.toDateString() === date.toDateString()
      }).length

      weekStats.push({ day: dayName, meetings: meetingsOnDay })
    }

    return weekStats
  }

  const completionRate = data.totalActionItems > 0 
    ? Math.round((data.completedActionItems / data.totalActionItems) * 100) 
    : 0

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Meetings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-3xl font-bold text-gray-900">{data.totalMeetings}</p>
                <p className="text-sm text-green-600 font-medium">
                  +{data.thisWeekMeetings} this week
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <FileAudio className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Duration */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Duration</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(data.totalDuration / 3600)}h
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  ~{formatDuration(data.averageMeetingLength)} avg
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action Items</p>
                <p className="text-3xl font-bold text-gray-900">{data.totalActionItems}</p>
                <p className="text-sm text-green-600 font-medium">
                  {completionRate}% completed
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Sources */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sources</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-gray-900">{data.recordedMeetings}</span>
                  <Mic className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-gray-900">{data.uploadedMeetings}</span>
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Recorded / Uploaded</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.weeklyStats.map((stat, index) => (
                <div key={stat.day} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{stat.day}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${data.totalMeetings > 0 ? (stat.meetings / Math.max(...data.weeklyStats.map(s => s.meetings), 1)) * 100 : 0}%`,
                        transitionDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-6">{stat.meetings}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Action Items Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {completionRate}%
                </div>
                <p className="text-sm text-gray-600">
                  {data.completedActionItems} of {data.totalActionItems} completed
                </p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{data.completedActionItems}</div>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {data.totalActionItems - data.completedActionItems}
                  </div>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Meetings
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/meetings'}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentMeetings.length === 0 ? (
            <div className="text-center py-8">
              <FileAudio className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No meetings yet</p>
              <p className="text-sm text-gray-400">Record your first meeting to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/meetings/${meeting.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      meeting.source === 'upload' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {meeting.source === 'upload' ? 
                        <Upload className="h-4 w-4 text-blue-600" /> : 
                        <Mic className="h-4 w-4 text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {meeting.title || 'Untitled Meeting'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.created_at).toLocaleDateString()} • {formatDuration(meeting.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meeting.action_items?.length > 0 && (
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                        {meeting.action_items.filter((ai: any) => ai.completed).length}/{meeting.action_items.length} actions
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
