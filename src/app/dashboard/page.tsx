'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase'
import { useSubscription } from '@/context/SubscriptionContext'
import { toast } from 'sonner'
import { 
  Mic, Upload, FileAudio, Clock, CheckCircle, AlertCircle, PlayCircle, Search, Trash2, Calendar, TrendingUp, Users, MessageSquare, Bookmark, Filter, Plus, BarChart3, Target, Zap, Gift, Star, Crown, Settings, Eye, Download, Share2, Brain, Sparkles, Activity, Globe, Shield, ExternalLink
} from 'lucide-react'

interface Meeting {
  id: string
  title: string
  created_at: string
  duration: number
  status: string
  transcript?: string
  summary?: string
  key_points?: string[]
  action_items?: any[]
  recording_url?: string
  meeting_platform?: string
}

interface TopicTracker {
  id: string
  name: string
  keywords: string[]
  mention_count: number
}

interface DashboardStats {
  totalMeetings: number
  meetingLimit: number
  meetingsLeft: number | string
  totalMinutes: number
  completedTasks: number
  thisWeekMeetings: number
  avgMeetingLength: number
  topTopics: TopicTracker[]
  creditsUsed: number
  creditsLimit: number
}

// Helper function to get plan limits - CORRECTED VERSION
const getPlanLimits = (planName: string) => {
  const limits = {
    'Free': { maxMeetings: 3, hasUnlimited: false },           // Free: 3 meetings
    'Pro': { maxMeetings: 50, hasUnlimited: false },           // Pro: 50 meetings  
    'Business': { maxMeetings: -1, hasUnlimited: true },       // Business: Unlimited
    'Enterprise': { maxMeetings: -1, hasUnlimited: true }      // Enterprise: Unlimited
  }
  
  return limits[planName as keyof typeof limits] || limits['Free']
}


export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalMeetings: 0,
    meetingLimit: 50,
    meetingsLeft: 50,
    totalMinutes: 0,
    completedTasks: 0,
    thisWeekMeetings: 0,
    avgMeetingLength: 0,
    topTopics: [],
    creditsUsed: 0,
    creditsLimit: 100
  })
  
  const router = useRouter()
  const supabase = createClient()
  const { subscription, loading: subscriptionLoading } = useSubscription()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  useEffect(() => {
    filterMeetings()
  }, [meetings, searchTerm, filterStatus])

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      await Promise.all([
        fetchMeetings(user.id),
        fetchStats(user.id)
      ])
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchMeetings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
      toast.error('Failed to load meetings')
    }
  }

  const fetchStats = async (userId: string) => {
  try {
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('id, duration, created_at, status')
        .eq('user_id', userId)

      if (meetingsError) throw meetingsError

      const meetingIds = meetingsData?.map(m => m.id) || []
      let completedTasks = 0
      
      if (meetingIds.length > 0) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id')
          .eq('status', 'completed')
          .in('meeting_id', meetingIds)

        if (!tasksError) {
          completedTasks = tasksData?.length || 0
        }
      }

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const thisWeekMeetings = meetingsData?.filter(m => 
        new Date(m.created_at) > oneWeekAgo
      ).length || 0

      const totalMinutes = Math.round(
        (meetingsData?.reduce((sum, m) => sum + (m.duration || 0), 0) || 0) / 60
      )

      const avgMeetingLength = meetingsData?.length > 0 
        ? Math.round(totalMinutes / meetingsData.length)
        : 0

      // Calculate meeting limits based on subscription
      const planLimits = getPlanLimits(subscription?.planName || 'Free')
      const meetingsCount = meetingsData?.length || 0
      const meetingsLeft = planLimits.hasUnlimited 
      ? 'Unlimited' 
      : Math.max(planLimits.maxMeetings - meetingsCount, 0)

      setStats({
        totalMeetings: meetingsCount,
        meetingLimit: planLimits.maxMeetings,
        meetingsLeft,
        totalMinutes,
        completedTasks,
        thisWeekMeetings,
        avgMeetingLength,
        topTopics: [
          { id: '1', name: 'Product Development', keywords: ['product', 'development'], mention_count: 25 },
          { id: '2', name: 'Marketing Strategy', keywords: ['marketing', 'campaign'], mention_count: 20 },
          { id: '3', name: 'Team Management', keywords: ['team', 'management'], mention_count: 15 }
        ],
        creditsUsed: Math.floor(totalMinutes / 10),
        creditsLimit: subscription?.planName === 'Free' ? 100 : -1
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filterMeetings = () => {
    let filtered = meetings

    if (searchTerm) {
      filtered = filtered.filter(meeting => 
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (meeting.summary && meeting.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (meeting.transcript && meeting.transcript.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === filterStatus)
    }

    setFilteredMeetings(filtered)
  }

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalSearchTerm.trim()) {
      setSearchTerm(globalSearchTerm)
      setActiveTab('overview')
      toast.info(`Searching for: ${globalSearchTerm}`)
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

      setMeetings(meetings.filter(m => m.id !== meetingId))
      toast.success('Meeting deleted successfully')
      
      if (user) {
        fetchStats(user.id)
      }
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error('Failed to delete meeting')
    }
  }

  const shareMeeting = async (meetingId: string) => {
    try {
      const shareUrl = `${window.location.origin}/meetings/${meetingId}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Meeting link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const downloadRecording = async (meetingId: string, recordingUrl: string) => {
    try {
      toast.info('Preparing download...')
      
      const { data, error } = await supabase.storage
        .from('recordings')
        .createSignedUrl(recordingUrl, 3600)

      if (error) throw error

      const link = document.createElement('a')
      link.href = data.signedUrl
      link.download = `meeting-${meetingId}.webm`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download recording')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { label: 'Processing', className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' },
      transcribed: { label: 'Transcribed', className: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
      completed: { label: 'Complete', className: 'bg-green-500/20 text-green-700 border-green-500/30' },
      failed: { label: 'Error', className: 'bg-red-500/20 text-red-700 border-red-500/30' },
      recording: { label: 'Recording', className: 'bg-orange-500/20 text-orange-700 border-orange-500/30' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing

    return (
      <Badge className={`glass-button border ${config.className} rounded-full px-3 py-1`}>
        {config.label}
      </Badge>
    )
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const meetingPercentage = stats.meetingLimit === -1 ? 5 : (stats.totalMeetings / stats.meetingLimit) * 100
  const isNearMeetingLimit = meetingPercentage > 80 && stats.meetingLimit !== -1

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="glass-card backdrop-blur-md bg-white/40 p-8 text-center rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-white min-h-screen p-6">
      {/* 🤍 PREMIUM WHITE HEADER SECTION */}
      <div className="glass-card p-8 border border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 🚀
            </h1>
            <p className="text-black/70 text-lg">Here's your meeting overview and analytics</p>
            {subscription && (
              <div className="mt-2">
                <Badge className={`${subscription.planName === 'Free' ? 'bg-gray-500/20 text-gray-700' : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-700'} border rounded-full px-3 py-1`}>
                  {subscription.planName} Plan
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => router.push('/settings')}
              className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-xl"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {subscription?.planName === 'Free' && (
              <Button 
                onClick={() => router.push('/pricing')}
                className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-lg rounded-xl"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Pro
              </Button>
            )}
          </div>
        </div>

        {/* Global Search with Glass Effect */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleGlobalSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black/40" />
            <Input
              placeholder="Search across all meetings, summaries, and tasks..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              className="glass-card backdrop-blur-md bg-white/30 pl-12 h-14 text-lg text-black placeholder:text-black/40 border-black/20 rounded-xl"
            />
            <Button 
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black text-white hover:bg-gray-800 rounded-lg"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Meeting Limit Warning */}
      {isNearMeetingLimit && (
        <Card className="gradient-card border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl backdrop-blur-md shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="glass-button backdrop-blur-md bg-orange-500/20 p-3 rounded-full">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">Meeting Limit Almost Reached</h3>
                  <p className="text-black/70">You've used {stats.totalMeetings} of {stats.meetingLimit} meetings ({Math.round(meetingPercentage)}%)</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/pricing')}
                className="bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 transition-all duration-200 rounded-xl"
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 💎 USAGE STATS - Updated to Meeting Count */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="gradient-card border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-black font-medium">Meeting Usage</span>
                {stats.meetingLimit === -1 ? (
                  <Badge className="bg-green-500/20 text-green-700 border-green-500/30 rounded-full px-3 py-1">
                    Unlimited ∞
                  </Badge>
                ) : (
                  <Badge className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 rounded-full px-3 py-1">
                    {typeof stats.meetingsLeft === 'number' ? stats.meetingsLeft : 0} meetings left
                  </Badge>
                )}
              </div>
              {subscription?.planName === 'Free' && stats.meetingLimit !== -1 && (
                <Button 
                  onClick={() => router.push('/pricing')}
                  className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-lg" 
                  size="sm"
                >
                  Upgrade
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-black">
                {stats.meetingLimit === -1 
                  ? `${stats.totalMeetings} meetings used`
                  : `${stats.totalMeetings} / ${stats.meetingLimit} meetings`
                }
              </span>
              <span className="text-black/70">
                {stats.meetingLimit === -1 ? 'Unlimited' : `${Math.round(meetingPercentage)}% used`}
              </span>
            </div>
            {stats.meetingLimit !== -1 && (
              <Progress value={meetingPercentage} className="h-3 bg-black/10 rounded-full" />
            )}
          </CardContent>
        </Card>

        <Card className="gradient-card border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-black font-medium">AI Processing</span>
                <Badge className={`rounded-full px-3 py-1 ${
                  subscription?.planName === 'Free' 
                    ? 'bg-orange-500/20 text-orange-700 border-orange-500/30'
                    : 'bg-green-500/20 text-green-700 border-green-500/30'
                }`}>
                  {subscription?.planName === 'Free' ? 'Limited' : 'Unlimited ∞'}
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-black/70">
                  {subscription?.planName === 'Free' ? 'Basic' : 'Premium'}
                </span>
              </div>
            </div>
            <div className={`text-xl font-bold mb-2 ${
              subscription?.planName === 'Free' ? 'text-orange-700' : 'text-green-700'
            }`}>
              {subscription?.planName === 'Free' 
                ? `${stats.creditsLimit - stats.creditsUsed} credits left`
                : 'Unlimited credits ∞'
              }
            </div>
            <div className="text-black/70">
              {stats.creditsUsed} credits used this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rest of the component remains the same... */}
      {/* 🎨 TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass backdrop-blur-md bg-white/30 border-black/20 grid w-full grid-cols-5 rounded-xl p-1">
          <TabsTrigger value="overview" className="text-black data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-black data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all duration-200">Upcoming</TabsTrigger>
          <TabsTrigger value="analytics" className="text-black data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all duration-200">Analytics</TabsTrigger>
          <TabsTrigger value="search" className="text-black data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all duration-200">Smart Search</TabsTrigger>
          <TabsTrigger value="apps" className="text-black data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all duration-200">AI Apps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 💫 STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="gradient-card border-black/10 hover:scale-105 transition-all duration-300 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-medium">Total Meetings</p>
                    <p className="text-3xl font-bold text-black">{stats.totalMeetings}</p>
                    <p className="text-black/50 text-xs">+{stats.thisWeekMeetings} this week</p>
                  </div>
                  <div className="glass-button backdrop-blur-md bg-white/30 p-3 rounded-full">
                    <FileAudio className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-black/10 hover:scale-105 transition-all duration-300 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-medium">Total Minutes</p>
                    <p className="text-3xl font-bold text-black">{stats.totalMinutes}</p>
                    <p className="text-black/50 text-xs">Avg {stats.avgMeetingLength} min</p>
                  </div>
                  <div className="glass-button backdrop-blur-md bg-white/30 p-3 rounded-full">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-black/10 hover:scale-105 transition-all duration-300 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-medium">Meetings Left</p>
                    <p className="text-3xl font-bold text-black">
                      {stats.meetingLimit === -1 ? '∞' : stats.meetingsLeft}
                    </p>
                    <p className="text-black/50 text-xs">
                      {stats.meetingLimit === -1 ? 'Unlimited plan' : 'This month'}
                    </p>
                  </div>
                  <div className="glass-button backdrop-blur-md bg-white/30 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-black/10 hover:scale-105 transition-all duration-300 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-medium">This Week</p>
                    <p className="text-3xl font-bold text-black">{stats.thisWeekMeetings}</p>
                    <p className="text-black/50 text-xs">New meetings</p>
                  </div>
                  <div className="glass-button backdrop-blur-md bg-white/30 p-3 rounded-full">
                    <TrendingUp className="h-8 w-8 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="gradient-card border-black/10 hover:scale-105 transition-all duration-300 group rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-black mb-2">Record Meeting</h3>
                    <p className="text-black/70">Start live recording with AI</p>
                    {stats.meetingLimit !== -1 && stats.meetingsLeft === 0 && (
                      <p className="text-red-600 text-sm">Limit reached - upgrade to continue</p>
                    )}
                  </div>
                  <div className="glass-button backdrop-blur-md bg-white/30 p-4 rounded-2xl group-hover:scale-110 transition-all duration-200">
                    <Mic className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <Button 
                  asChild={stats.meetingLimit === -1 || stats.meetingsLeft !== 0}
                  onClick={stats.meetingsLeft === 0 ? () => router.push('/pricing') : undefined}
                  className={`w-full ${
                    stats.meetingLimit !== -1 && stats.meetingsLeft === 0
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-black text-black hover:bg-gray-800'
                  } glass-button backdrop-blur-md bg-white/30 hover:scale-105 transition-all duration-200 shadow-lg rounded-xl`} 
                  size="lg"
                >
                  {stats.meetingLimit !== -1 && stats.meetingsLeft === 0 ? (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Upgrade to Record
                    </>
                  ) : (
                    <Link href="/record">
                      <Mic className="mr-2 h-5 w-5" />
                      Start Recording
                    </Link>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="gradient-card border-black/10 hover:scale-105 transition-all duration-300 group rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-black mb-2">Upload File</h3>
                    <p className="text-black/70">Process existing recordings</p>
                  </div>
                  <div className="glass-button backdrop-blur-md bg-white/30 p-4 rounded-2xl group-hover:scale-110 transition-all duration-200">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <Button asChild className="w-full glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-xl" size="lg">
                  <Link href="/upload">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Audio
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="gradient-card border-black/10 hover:scale-105 transition-all duration-300 group rounded-2xl backdrop-blur-md bg-white/40 shadow-lg hover:shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-black mb-2">View Meetings</h3>
                    <p className="text-black/70">Browse all your recordings</p>
                  </div>
                  <div className="glass-button backdrop-blur-md bg-white/30 p-4 rounded-2xl group-hover:scale-110 transition-all duration-200">
                    <FileAudio className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <Button asChild className="w-full glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-xl" size="lg">
                  <Link href="/meetings">
                    <FileAudio className="mr-2 h-5 w-5" />
                    View All Meetings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Meetings List */}
          <Card className="glass-card border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-black text-2xl">
                  <FileAudio className="h-6 w-6" />
                  Recent Meetings
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <Input
                      placeholder="Search meetings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="glass backdrop-blur-md bg-white/30 pl-10 w-64 text-black placeholder:text-black/40 border-black/20 rounded-xl"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="glass backdrop-blur-md bg-white/30 w-40 text-black border-black/20 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass backdrop-blur-md bg-white/90 border-black/20 rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="transcribed">Transcribed</SelectItem>
                      <SelectItem value="completed">Complete</SelectItem>
                      <SelectItem value="failed">Error</SelectItem>
                      <SelectItem value="recording">Recording</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="glass-button backdrop-blur-md bg-white/30 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <FileAudio className="h-12 w-12 text-black/40" />
                  </div>
                  <h3 className="text-2xl font-semibold text-black mb-4">
                    {meetings.length === 0 ? 'No meetings yet' : 'No meetings match your search'}
                  </h3>
                  <p className="text-black/70 mb-8 text-lg">
                    {meetings.length === 0 
                      ? 'Record or upload your first meeting to get started with AI-powered insights'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                  {meetings.length === 0 && (
                    <div className="flex gap-4 justify-center">
                      {stats.meetingLimit === -1 || stats.meetingsLeft !== 0 ? (
                        <Button asChild className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-lg rounded-xl" size="lg">
                          <Link href="/record">
                            <Mic className="mr-2 h-5 w-5" />
                            Record Meeting
                          </Link>
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => router.push('/pricing')}
                          className="bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 transition-all duration-200 shadow-lg rounded-xl" 
                          size="lg"
                        >
                          <Crown className="mr-2 h-5 w-5" />
                          Upgrade to Record
                        </Button>
                      )}
                      <Button asChild className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-xl" size="lg">
                        <Link href="/upload">
                          <Upload className="mr-2 h-5 w-5" />
                          Upload File
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMeetings.slice(0, 10).map((meeting) => (
                    <div key={meeting.id} className="gradient-card backdrop-blur-md bg-white/30 p-6 hover:scale-102 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-black">{meeting.title}</h3>
                            {getStatusBadge(meeting.status)}
                            {meeting.meeting_platform && (
                              <Badge className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 rounded-full px-2 py-1 text-xs">
                                {meeting.meeting_platform}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-black/70">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(meeting.created_at)}
                            </span>
                            <span>Duration: {formatDuration(meeting.duration)}</span>
                            {meeting.action_items && meeting.action_items.length > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                {meeting.action_items.length} tasks
                              </span>
                            )}
                          </div>
                          {meeting.summary && (
                            <p className="text-black/60 text-sm mt-2 line-clamp-2">{meeting.summary}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button asChild className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:bg-white/50 rounded-lg" size="sm">
                            <Link href={`/meetings/${meeting.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                          {meeting.recording_url && (
                            <Button 
                              onClick={() => downloadRecording(meeting.id, meeting.recording_url!)}
                              className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:bg-white/50 rounded-lg" 
                              size="sm"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            onClick={() => shareMeeting(meeting.id)}
                            className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:bg-white/50 rounded-lg" 
                            size="sm"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            className="glass-button backdrop-blur-md bg-red-500/20 text-red-600 border-red-400/30 hover:bg-red-500/30 rounded-lg"
                            size="sm"
                            onClick={() => deleteMeeting(meeting.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMeetings.length > 10 && (
                    <div className="text-center py-4 border-t border-black/20">
                      <p className="text-black/70 mb-2">Showing 10 of {filteredMeetings.length} meetings</p>
                      <Button asChild className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-xl">
                        <Link href="/meetings">
                          View All Meetings
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs remain similar with appropriate feature gating */}
        <TabsContent value="upcoming" className="space-y-6">
          <Card className="glass-card border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Calendar className="h-5 w-5" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-black/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">No upcoming meetings</h3>
                <p className="text-black/70 mb-6">Connect your calendar to automatically see scheduled meetings</p>
                <Button 
                  onClick={() => toast.info('Calendar integration coming soon!')}
                  className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-xl"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="glass-card border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Target className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-black/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  {subscription?.planName === 'Free' ? 'Analytics Available in Pro' : 'Analytics Coming Soon'}
                </h3>
                <p className="text-black/70 mb-6">
                  {subscription?.planName === 'Free' 
                    ? 'Upgrade to Pro to unlock detailed meeting analytics and insights'
                    : 'Advanced meeting analytics and insights'
                  }
                </p>
                {subscription?.planName === 'Free' && (
                  <Button 
                    onClick={() => router.push('/pricing')}
                    className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-lg rounded-xl"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card className="glass-card border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Search className="h-5 w-5" />
                Smart Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-black/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  {subscription?.planName === 'Free' ? 'Smart Search Available in Pro' : 'Smart Search Coming Soon'}
                </h3>
                <p className="text-black/70 mb-6">
                  {subscription?.planName === 'Free'
                    ? 'Upgrade to Pro for AI-powered search across all your meetings'
                    : 'AI-powered search across all your meetings'
                  }
                </p>
                {subscription?.planName === 'Free' && (
                  <Button 
                    onClick={() => router.push('/pricing')}  
                    className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-lg rounded-xl"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps" className="space-y-6">
          <Card className="glass-card border-black/10 rounded-2xl backdrop-blur-md bg-white/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Brain className="h-5 w-5" />
                AI Apps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-black/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">AI Apps Coming Soon</h3>
                <p className="text-black/70 mb-6">Custom AI applications for your meetings</p>
                <Button 
                  onClick={() => toast.info('AI Apps feature coming soon!')}
                  className="glass-button backdrop-blur-md bg-white/30 text-black border-black/20 hover:scale-105 transition-all duration-200 hover:bg-white/50 rounded-xl"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Get Notified
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
