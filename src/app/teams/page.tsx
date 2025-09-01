'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { trackUserActivity } from '@/lib/activity-tracker'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  Edit,
  Trash2,
  MoreVertical,
  Send,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Check,
  X,
  Clock,
  Calendar,
  Target,
  BarChart3,
  Activity,
  TrendingUp,
  Award,
  Star,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  MessageSquare,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Calendar as CalendarIcon,
  Zap,
  Brain,
  Mic,
  FileText,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  UserX,
  Key,
  Lock,
  Unlock,
  Ban,
  RotateCcw,
  History,
  Bell,
  Sliders,
  Database,
  Network,
  Layers,
  GitBranch,
  Building,
  Timer,
  DollarSign,
  TrendingDown,
  Folder,
  Archive,
  Cpu,
  HardDrive,
  Wifi,
  Share,
  ShieldCheck,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Headphones,
  Video
} from "lucide-react"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript Interfaces
interface TeamMember {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'pending' | 'inactive' | 'suspended'
  joined_at: string
  last_active: string
  department?: string
  title?: string
  location?: string
  phone?: string
  timezone?: string
  language?: string
  two_factor_enabled: boolean
  usage_stats: {
    meetings_recorded: number
    meetings_attended: number
    ai_analyses_used: number
    storage_used: number
    last_activity: string
    total_meeting_time: number
    tasks_completed: number
    tasks_created: number
    comments_made: number
    files_uploaded: number
  }
  permissions: {
    can_record: boolean
    can_invite: boolean
    can_delete: boolean
    can_export: boolean
    can_view_analytics: boolean
    can_manage_billing: boolean
    can_manage_integrations: boolean
    can_access_api: boolean
    can_create_templates: boolean
    can_moderate_content: boolean
  }
  billing_info?: {
    cost_center?: string
    allocated_budget?: number
    current_usage_cost?: number
  }
}

interface TeamInvite {
  id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  invited_by: string
  invited_by_name: string
  invited_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  custom_message?: string
  department?: string
  access_level: 'full' | 'restricted'
}

interface TeamSettings {
  allow_member_invites: boolean
  require_approval_for_invites: boolean
  auto_assign_role: 'member' | 'viewer'
  meeting_sharing_default: boolean
  data_retention_days: number
  enforce_2fa: boolean
  allowed_domains: string[]
  max_members: number
  max_storage_gb: number
  meeting_recording_auto_delete: boolean
  auto_delete_days: number
  require_meeting_approval: boolean
  allow_external_sharing: boolean
  enable_api_access: boolean
  webhook_url?: string
  slack_integration: boolean
  teams_integration: boolean
  google_workspace_integration: boolean
  single_sign_on: boolean
  audit_logging: boolean
  ip_whitelist: string[]
  session_timeout_hours: number
}

interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  resource: string
  details: string
  ip_address: string
  user_agent: string
  timestamp: string
  success: boolean
}

interface TeamDepartment {
  id: string
  name: string
  description?: string
  budget?: number
  head_user_id?: string
  member_count: number
  meeting_quota?: number
  storage_quota_gb?: number
}

interface AccessRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  requested_role: 'admin' | 'member' | 'viewer'
  requested_permissions: string[]
  reason: string
  status: 'pending' | 'approved' | 'denied'
  requested_at: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
}

export default function TeamManagementPage() {
  // State management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [departments, setDepartments] = useState<TeamDepartment[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  
  const [teamSettings, setTeamSettings] = useState<TeamSettings>({
    allow_member_invites: true,
    require_approval_for_invites: false,
    auto_assign_role: 'member',
    meeting_sharing_default: true,
    data_retention_days: 365,
    enforce_2fa: false,
    allowed_domains: [],
    max_members: 10,
    max_storage_gb: 100,
    meeting_recording_auto_delete: false,
    auto_delete_days: 90,
    require_meeting_approval: false,
    allow_external_sharing: true,
    enable_api_access: false,
    slack_integration: false,
    teams_integration: false,
    google_workspace_integration: false,
    single_sign_on: false,
    audit_logging: true,
    ip_whitelist: [],
    session_timeout_hours: 24
  })
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('members')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [bulkActions, setBulkActions] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('list')
  const [inviteMethod, setInviteMethod] = useState('single')
  
  const [inviteForm, setInviteForm] = useState({
    emails: '',
    singleEmail: '',
    role: 'member' as 'admin' | 'member' | 'viewer',
    message: '',
    send_welcome: true,
    department: '',
    access_level: 'full' as 'full' | 'restricted',
    expires_in_days: 7
  })

  const [bulkImportData, setBulkImportData] = useState({
    csv_content: '',
    auto_send_invites: true,
    default_role: 'member' as 'admin' | 'member' | 'viewer',
    skip_validation: false
  })

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    budget: 0,
    meeting_quota: 50,
    storage_quota_gb: 10
  })
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingInvites: 0,
    totalMeetings: 0,
    totalStorage: 0,
    monthlyActiveUsers: 0,
    averageSessionTime: 0,
    topPerformers: [] as TeamMember[],
    departmentBreakdown: [] as { department: string; count: number }[],
    roleDistribution: [] as { role: string; count: number }[],
    growthRate: 0,
    churnRate: 0,
    engagementScore: 0
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    trackUserActivity('teams_view')
  }, [])

  useEffect(() => {
    fetchTeamData()
  }, [])

  // ✅ Enhanced Error Logging Utility
const logSupabaseError = (context: string, error: any) => {
  console.log(`🔍 ${context} - Raw error:`, error)
  
  if (!error) {
    console.error(`❌ ${context}: No error information`)
    return
  }
  
  if (typeof error === 'string') {
    console.error(`❌ ${context}: ${error}`)
    return
  }
  
  // Try different error properties
  if (error.message) {
    console.error(`❌ ${context}: ${error.message}`)
  } else if (error.details) {
    console.error(`❌ ${context}: ${error.details}`)
  } else if (error.hint) {
    console.error(`❌ ${context}: ${error.hint}`)
  } else if (error.code) {
    console.error(`❌ ${context}: Error code ${error.code}`)
  } else {
    // Log the full error object structure
    console.error(`❌ ${context}: Full error object:`, JSON.stringify(error, null, 2))
  }
}

// ✅ Complete Updated fetchTeamData Function
const fetchTeamData = useCallback(async () => {
  try {
    setLoading(true)
    
    // ✅ Step 1: Verify authentication state
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Authentication error:', authError)
      toast.error('Please log in again')
      router.push('/login')
      return
    }

    // ✅ Step 2: Verify session is valid and active
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('❌ Session error:', sessionError)
      toast.error('Session expired. Please log in again')
      router.push('/login')
      return
    }

    console.log('✅ User authenticated:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionValid: !!session
    })

    setCurrentUser(user)

    // ✅ Enhanced ensureTeamSettings with better error handling
    // ✅ Fixed ensureTeamSettings function
const ensureTeamSettings = async (workspaceId: string) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('team_settings')
      .select('id')
      .eq('workspace_id', workspaceId)
    if (existingError) {
      logSupabaseError('Error checking existing team settings', existingError)
      return
    }

    // ✅ Only create if settings don't exist
    if (!existing) {
      const defaultSettings = {
        workspace_id: workspaceId,
        allow_member_invites: true,
        require_approval_for_invites: false,
        auto_assign_role: 'member',
        meeting_sharing_default: true,
        data_retention_days: 365,
        enforce_2fa: false,
        max_members: 10,
        max_storage_gb: 100,
        meeting_recording_auto_delete: false,
        auto_delete_days: 90,
        require_meeting_approval: false,
        allow_external_sharing: true,
        enable_api_access: false,
        slack_integration: false,
        teams_integration: false,
        google_workspace_integration: false,
        single_sign_on: false,
        audit_logging: true,
        ip_whitelist: [],
        session_timeout_hours: 24
      }

      // ✅ Use UPSERT instead of INSERT to handle duplicates gracefully
      const { data, error } = await supabase
        .from('team_settings')
        .upsert(defaultSettings, {
          onConflict: 'workspace_id'  // ✅ Handle conflict on workspace_id
        })
        .select()

      if (error) {
        logSupabaseError('Error creating default team settings', error)
        // Don't throw - continue with defaults
        console.warn('⚠️ Using fallback team settings due to creation error')
        return
      } else {
        console.log('✅ Created/updated default team settings:', data)
      }
    } else {
      console.log('✅ Team settings already exist, skipping creation')
    }
  } catch (error) {
    logSupabaseError('Error in ensureTeamSettings', error)
  }
}

    // Get user workspace with fallback creation
    let workspaceId: string | null = null
    
    // Try to get existing user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', user.id)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      logSupabaseError('Error fetching user data', userError)
    }

    workspaceId = userData?.workspace_id

    // If no workspace, create one
    if (!workspaceId) {
      try {
        const { data: newWorkspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: `${user.email?.split('@')[0]}'s Workspace`,
            subscription_plan: 'free',
            max_users: 5
          })
          .select()

        if (workspaceError) {
          logSupabaseError('Error creating workspace', workspaceError)
          toast.error('Failed to create workspace. Please contact support.')
          return
        }

        workspaceId = workspaceArray?.[0]?.id

        // Create user record
        await supabase
          .from('users')
          .upsert({
            id: user.id,
            workspace_id: workspaceId,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || 'User',
            role: 'owner',
            status: 'active'
          })

        console.log('✅ Created new workspace and user record')
      } catch (error) {
        logSupabaseError('Error in workspace creation process', error)
        toast.error('Failed to set up workspace. Please try again.')
        return
      }
    }

    if (workspaceId) {
      await ensureTeamSettings(workspaceId)
    }

    // ✅ Enhanced fetchWithErrorHandling function
    const fetchWithErrorHandling = async <T>(
      query: () => Promise<{ data: T[] | T | null, error: any }>,
      dataName: string,
      setState: (data: T[]) => void
    ) => {
      try {
        const { data, error } = await query()
        
        if (error && error.code !== 'PGRST116') {
          logSupabaseError(`Error fetching ${dataName}`, error)
          
          // Don't show toast for missing tables - they're optional
          if (!error.message?.includes('does not exist')) {
            toast.error(`Failed to load ${dataName}`)
          }
        } else {
          // Handle both array and single object responses
          if (Array.isArray(data)) {
            setState(data || [])
          } else {
            setState(data ? [data] : [])
          }
        }
      } catch (error) {
        logSupabaseError(`Exception fetching ${dataName}`, error)
        setState([])
      }
    }

    // ✅ Fetch all data with improved error handling
    await Promise.all([
      fetchWithErrorHandling(
        () => supabase.from('team_members').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
        'team members',
        setTeamMembers
      ),
      fetchWithErrorHandling(
        () => supabase.from('user_invitations').select('*').eq('workspace_id', workspaceId).eq('status', 'pending').order('created_at', { ascending: false }),
        'team invites',
        setTeamInvites
      ),
      fetchWithErrorHandling(
        () => supabase.from('departments').select('*').eq('workspace_id', workspaceId).order('name', { ascending: true }),
        'departments',
        setDepartments
      ),
      fetchWithErrorHandling(
        () => supabase.from('audit_logs').select('*').eq('workspace_id', workspaceId).order('timestamp', { ascending: false }).limit(20),
        'audit logs',
        setAuditLogs
      )
    ])

    // ✅ Optional: Try to fetch access requests (might not exist)
    try {
      await fetchWithErrorHandling(
        () => supabase.from('access_requests').select('*').eq('workspace_id', workspaceId).eq('status', 'pending').order('requested_at', { ascending: false }),
        'access requests',
        setAccessRequests
      )
    } catch (error) {
      // Silently fail if access_requests table doesn't exist
      console.log('Access requests table not found, skipping...')
      setAccessRequests([])
    }

    // Fetch team settings with fallback
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('team_settings')
        .select('*')
        .eq('workspace_id', workspaceId)

      if (settingsError && settingsError.code !== 'PGRST116') {
        logSupabaseError('Error fetching team settings', settingsError)
      } else if (settingsData) {
        setTeamSettings(prev => ({ ...prev, ...settingsData }))
      }
    } catch (error) {
      logSupabaseError('Exception fetching team settings', error)
    }

    // Calculate team stats
    const members = teamMembers || []
    const invites = teamInvites || []
    const depts = departments || []

    const stats = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active').length,
      pendingInvites: invites.filter(i => i.status === 'pending').length,
      totalMeetings: 0,
      totalStorage: members.reduce((sum, m) => sum + (m.usage_stats?.storage_used || 0), 0),
      monthlyActiveUsers: members.filter(m => 
        new Date(m.last_active) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      averageSessionTime: 142,
      topPerformers: members
        .sort((a, b) => (b.usage_stats?.meetings_recorded || 0) - (a.usage_stats?.meetings_recorded || 0))
        .slice(0, 3),
      departmentBreakdown: depts.map(dept => ({
        department: dept.name,
        count: dept.member_count || 0
      })),
      roleDistribution: [
        { role: 'Owner', count: members.filter(m => m.role === 'owner').length },
        { role: 'Admin', count: members.filter(m => m.role === 'admin').length },
        { role: 'Member', count: members.filter(m => m.role === 'member').length },
        { role: 'Viewer', count: members.filter(m => m.role === 'viewer').length }
      ],
      growthRate: 0,
      churnRate: 0,
      engagementScore: Math.min(Math.round((members.filter(m => m.status === 'active').length / Math.max(members.length, 1)) * 100), 100)
    }

    setTeamStats(stats)

  } catch (error) {
    logSupabaseError('Error in fetchTeamData', error)
    toast.error('Failed to load team information')
  } finally {
    setLoading(false)
  }
}, [router, supabase])

// ✅ FIXED: Add missing fetchDepartments function
  const fetchDepartments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!userData?.workspace_id) return

      const { data: deptData, error } = await supabase
        .from('departments')
        .select('*')
        .eq('workspace_id', userData.workspace_id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching departments:', error)
      } else {
        setDepartments(deptData || [])
      }
    } catch (error) {
      console.error('Error in fetchDepartments:', error)
    }
  }, [supabase])

  // ✅ FIXED: Complete sendInvites function
  const sendInvites = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📤 Starting sendInvites...')
    console.log('📋 Invite form:', inviteForm)
    console.log('🔄 Invite method:', inviteMethod)
    
    try {
      // Check if using bulk emails or single email
      let emailsToProcess: string[] = []
      
      if (inviteMethod === 'single') {
        // Single email mode
        if (!inviteForm.singleEmail?.trim()) {
          toast.error('Please enter an email address')
          return
        }
        emailsToProcess = [inviteForm.singleEmail.trim()]
      } else {
        // Bulk emails mode
        if (!inviteForm.emails?.trim()) {
          toast.error('Please enter at least one email address')
          return
        }
        
        emailsToProcess = inviteForm.emails
          .split(/[,\n]/)
          .map(email => email.trim())
          .filter(email => email.length > 0)
      }

      if (emailsToProcess.length === 0) {
        toast.error('Please enter at least one valid email address')
        return
      }

      if (!inviteForm.role) {
        toast.error('Please select a role')
        return
      }

      console.log('📧 Emails to process:', emailsToProcess)

      // Show processing toast for multiple invitations
      const processingToast = emailsToProcess.length > 1 
        ? toast.loading(`Processing ${emailsToProcess.length} invitations...`)
        : null

      let successful = 0
      let failed = 0

      // Process each email using the enhanced handleCopyInviteLink logic
      for (let i = 0; i < emailsToProcess.length; i++) {
        const email = emailsToProcess[i]
        
        try {
          // Temporarily set the single email for processing
          const originalSingleEmail = inviteForm.singleEmail
          setInviteForm(prev => ({ ...prev, singleEmail: email }))
          
          // Call the existing enhanced invitation logic
          await handleCopyInviteLink()
          
          // Restore original value
          setInviteForm(prev => ({ ...prev, singleEmail: originalSingleEmail }))
          
          successful++
          
          // Small delay between invitations to avoid rate limiting
          if (i < emailsToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
        } catch (error) {
          console.error(`❌ Failed to process ${email}:`, error)
          failed++
        }
      }

      // Dismiss processing toast
      if (processingToast) {
        toast.dismiss(processingToast)
      }

      // Show final results
      if (successful > 0) {
        toast.success(`🎉 Successfully sent ${successful} invitation${successful > 1 ? 's' : ''}!`)
      }
      
      if (failed > 0) {
        toast.error(`❌ Failed to send ${failed} invitation${failed > 1 ? 's' : ''}`)
      }

      // Reset form and close modal if all successful
      if (failed === 0) {
        setInviteForm(prev => ({
          ...prev,
          emails: '',
          singleEmail: '',
          message: ''
        }))
        
        setShowInviteModal(false)
        fetchTeamData()
      }

    } catch (error) {
      console.error('❌ Error in sendInvites:', error)
      toast.error('Failed to send invitations')
    }
  }

  // ✅ FIXED: Complete handleCopyInviteLink function
  const handleCopyInviteLink = async () => {
    try {
      console.log('🚀 Starting handleCopyInviteLink...')
      
      // Get email from singleEmail field
      const targetEmail = inviteForm.singleEmail?.trim()
      
      console.log('📧 Target email:', targetEmail)
      
      if (!targetEmail) {
        toast.error('Please enter an email address first')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(targetEmail)) {
        toast.error('Please enter a valid email address')
        return
      }

      if (!inviteForm.role) {
        toast.error('Please select a role for the invitation')
        return
      }

      const token = crypto.randomUUID()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 Current user:', user)
      
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Enhanced user workspace query with comprehensive fallback strategy
      console.log('🔍 Querying workspace for user ID:', user.id)
      
      let userData = null

      // Try to get user's workspace by ID first
      const { data: userDataById, error: userErrorById } = await supabase
        .from('users')
        .select(`
          workspace_id,
          workspaces(name, subscription_plan)
        `)
        .eq('id', user.id)
        .maybeSingle()

      console.log('📊 User data by ID:', userDataById)

      if (!userErrorById && userDataById?.workspace_id) {
        userData = userDataById
      } else {
        // Fallback: try to find by email
        console.log('🔄 Trying fallback query by email:', user.email)
        
        const { data: userDataByEmail, error: userErrorByEmail } = await supabase
          .from('users')
          .select(`
            workspace_id,
            workspaces(name, subscription_plan)
          `)
          .eq('email', user.email)
          .maybeSingle()

        console.log('📧 User data by email:', userDataByEmail)

        if (!userErrorByEmail && userDataByEmail?.workspace_id) {
          userData = userDataByEmail
        } else {
          // Enhanced workspace creation with detailed debugging
          const { data: newWorkspace, error: workspaceError } = await supabase
            .from('workspaces')
            .insert({
              name: `${user.email?.split('@')[0]}'s Workspace`,
              subscription_plan: 'free',
              max_users: 5
            })
            .select()
          // Enhanced error logging
          console.log('🔍 Workspace insertion attempt:')
          console.log('📊 Data returned:', newWorkspace)
          console.log('❌ Error details:', JSON.stringify(workspaceError, null, 2))
          console.log('🔍 Error code:', workspaceError?.code)
          console.log('🔍 Error message:', workspaceError?.message)

          if (workspaceError) {
            console.error('❌ Error creating workspace:', workspaceError)
            toast.error(`Failed to create workspace: ${workspaceError?.message || 'Unknown error'}`)
            return
          }

          // Create user record
          const { error: createUserError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              workspace_id: newWorkspace.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || 'User',
              role: 'owner',
              status: 'active'
            })

          if (createUserError) {
            console.error('❌ Error creating user:', createUserError)
            toast.error('Failed to create user record')
            return
          }

          userData = {
            workspace_id: newWorkspace.id,
            workspaces: {
              name: newWorkspace.name,
              subscription_plan: newWorkspace.subscription_plan
            }
          }

          console.log('✅ Created new workspace and user:', userData)
        }
      }

      if (!userData?.workspace_id) {
        console.error('❌ Could not determine workspace after all attempts')
        toast.error('Could not determine your workspace. Please contact support.')
        return
      }

      console.log('✅ Final workspace data:', userData)

      // Enhanced: Check if user already exists in auth system for dual-channel invites
      try {
        const { data: existingAuthUser, error: authError } = await supabase.auth.admin.getUserByEmail(targetEmail)
        
        console.log('🔍 Existing auth user check:', existingAuthUser)
        
        if (existingAuthUser.user) {
          console.log('📱 User exists - sending both in-app notification and email invite')
          
          // 1. Create in-app notification for existing user
          await createInAppNotification(targetEmail, existingAuthUser.user.id, userData, user)
          
          // 2. ALSO create email invitation record for backup/tracking
          await createEmailInvitation(targetEmail, userData, token, user)
          
          toast.success(`🎉 Invitation sent to ${targetEmail}!`)
          toast.info('📱 In-app notification + 📧 Email invite both sent for maximum reach')
          return
        }
      } catch (adminError) {
        console.log('⚠️ Admin getUserByEmail not available, proceeding with email invite only')
      }

      // User doesn't exist - send traditional email invitation only
      console.log('📧 New user - sending email invitation')
      await createEmailInvitation(targetEmail, userData, token, user)
      
      const inviteLink = `${window.location.origin}/accept-invite?token=${token}`
      await navigator.clipboard.writeText(inviteLink)
      
      toast.success(`📧 Email invitation sent to ${targetEmail}!`)
      toast.info('Invite link copied to clipboard - share via WhatsApp, Slack, or any messaging app')

    } catch (error) {
      console.error('💥 Error in handleCopyInviteLink:', error)
      toast.error('Failed to send invitation: ' + (error as Error).message)
    }
  }

  // ✅ FIXED: Complete createInAppNotification function
  const createInAppNotification = async (email: string, userId: string, userData: any, currentUser: any) => {
    try {
      console.log('🔔 Creating notification for user:', userId)
      
      const notificationData = {
        user_id: userId,
        type: 'invite',
        title: '🎉 Workspace Invitation',
        body: `${currentUser.email} has invited you to join "${userData.workspaces?.name}"`,
        metadata: {
          workspace_id: userData.workspace_id,
          invite_role: inviteForm.role,
          invited_by: currentUser.email
        },
        created_at: new Date().toISOString()
      }

      console.log('📤 Notification data:', notificationData)

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()

      if (error) {
        console.error('❌ Notification insert error:', error)
        throw error
      }

      console.log('✅ Notification created:', data)

    } catch (error) {
      console.error('❌ Failed to create notification:', error)
    }
  }

  // ✅ FIXED: Complete createEmailInvitation function
  const createEmailInvitation = async (email: string, userData: any, token: string, currentUser: any) => {
    try {
      const invitationData = {
        email: email,
        role: inviteForm.role,
        department: inviteForm.department || null,
        custom_message: inviteForm.message || null,
        invited_by: currentUser.id,
        invited_by_name: currentUser.email || 'Admin',
        invite_token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        workspace_id: userData.workspace_id
      }

      console.log('📝 Creating invitation:', invitationData)

      const { data, error } = await supabase
        .from('user_invitations')
        .upsert(invitationData, {
          onConflict: 'email,workspace_id'
        })
        .select()

      if (error) throw error

      console.log('✅ Email invitation created successfully:', data)

      // NOW ACTUALLY SEND THE EMAIL
      await sendInviteEmail(email, userData.workspaces?.name, inviteForm.role, token)

    } catch (error) {
      console.error('❌ Failed to create email invitation:', error)
      throw error
    }
  }

  // ✅ FIXED: Complete sendInviteEmail function
  const sendInviteEmail = async (email: string, workspaceName: string, role: string, token: string) => {
    try {
      const response = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          workspaceName: workspaceName || 'Luminameeting',
          role,
          inviteUrl: `${window.location.origin}/accept-invite?token=${token}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const result = await response.json()
      console.log('✅ Email sent successfully via Resend:', result)
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error)
      // Don't fail the whole process if email fails
      toast.error('Invitation created but email failed to send')
    }
  }

  // ✅ FIXED: Complete processBulkImport function
  const processBulkImport = async () => {
    try {
      if (!bulkImportData.csv_content.trim()) {
        toast.error('Please paste CSV content')
        return
      }

      const lines = bulkImportData.csv_content.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      if (!headers.includes('email')) {
        toast.error('CSV must contain an "email" column')
        return
      }

      const records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const record: any = {}
        headers.forEach((header, index) => {
          record[header] = values[index] || ''
        })
        return record
      })

      // Get current user and workspace info
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', user?.id)
        .maybeSingle()

      // Create invites from CSV data
      const invitesToCreate = records.map((record: any) => ({
        email: record.email,
        role: record.role || bulkImportData.default_role,
        department: record.department || null,
        invited_by: user?.id,
        invited_by_name: user?.email || 'System',
        invite_token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        workspace_id: userData?.workspace_id
      }))

      const { data, error } = await supabase
        .from('user_invitations')
        .insert(invitesToCreate)

      if (error) {
        console.error('Error bulk importing:', error)
        toast.error('Failed to process bulk import')
        return
      }

      toast.success(`Successfully processed ${records.length} bulk invites!`)
      setBulkImportData({
        csv_content: '',
        auto_send_invites: true,
        default_role: 'member',
        skip_validation: false
      })
      setShowBulkImport(false)
      
      fetchTeamData()
      
    } catch (error) {
      console.error('Error processing bulk import:', error)
      toast.error('Failed to process bulk import')
    }
  }

  // ✅ FIXED: Complete createDepartment function
  const createDepartment = async () => {
    try {
      if (!newDepartment.name.trim()) {
        toast.error('Department name is required')
        return
      }

      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ No authenticated user')
        toast.error('You must be logged in')
        return
      }

      console.log('👤 Current auth user ID:', user.id)

      // Get user's workspace_id from your existing data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('workspace_id, role, full_name')
        .eq('id', user.id)
        .maybeSingle()

      console.log('📊 User query result:', userData, userError)

      // If user not found by ID, try to find by email
      let workspaceId = userData?.workspace_id

      if (!workspaceId && user.email) {
        console.log('🔍 Trying to find user by email:', user.email)
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('workspace_id, role')
          .eq('email', user.email)
          .maybeSingle()

        console.log('📧 Email query result:', userByEmail, emailError)
        workspaceId = userByEmail?.workspace_id
      }

      // ✅ Enhanced workspace creation with detailed diagnostics
if (!workspaceId) {
  try {
    console.log('🔍 Starting workspace creation...')
    console.log('📋 User details:', {
      id: user.id,
      email: user.email,
      aud: user.aud,
      role: user.role
    })

    // ✅ Test database connection first
    const { data: testData, error: testError } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Database connection test failed:', {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint
      })
      
      if (testError.code === '42501') {
        toast.error('Database permission error. Running permission fix...')
        // You might want to redirect to a setup page or show instructions
        return
      }
    } else {
      console.log('✅ Database connection test passed')
    }

    const { data: newWorkspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: `${user.email?.split('@')[0]}'s Workspace`,
        subscription_plan: 'free',
        max_users: 5
      })
      .select()
      .maybeSingle()

    if (workspaceError) {
      console.error('❌ Detailed workspace error:', {
        code: workspaceError.code,
        message: workspaceError.message,
        details: workspaceError.details,
        hint: workspaceError.hint,
        statusCode: workspaceError.statusCode
      })
      
      // ✅ Specific error handling
      if (workspaceError.code === '42501') {
        toast.error('Permission denied. Please contact admin to grant database permissions.')
      } else if (workspaceError.message?.includes('row-level security')) {
        toast.error('Security policy error. Please check RLS policies.')
      } else if (workspaceError.message?.includes('violates check constraint')) {
        toast.error('Data validation error. Please check input values.')
      } else {
        toast.error(`Workspace creation failed: ${workspaceError.message}`)
      }
      return
    }

    workspaceId = newWorkspace.id
    console.log('✅ Workspace created successfully:', workspaceId)

    // Create user record
    const { error: createUserError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        workspace_id: workspaceId,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'User',
        role: 'owner',
        status: 'active'
      })

    if (createUserError) {
      logSupabaseError('Error creating user record', createUserError)
      toast.error('Failed to create user record')
      return
    }

    console.log('✅ Created new workspace and user record')
  } catch (error) {
    console.error('💥 Exception in workspace creation:', error)
    logSupabaseError('Error in workspace creation process', error)
    toast.error('Failed to set up workspace. Please try again.')
    return
  }
}

      // Create the department
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: newDepartment.name,
          description: newDepartment.description,
          budget: newDepartment.budget,
          meeting_quota: newDepartment.meeting_quota,
          storage_quota_gb: newDepartment.storage_quota_gb,
          workspace_id: workspaceId,
          created_by: user.id
        })
        .select()

      if (error) {
        console.error('Error creating department:', error)
        toast.error('Failed to create department')
        return
      }

      toast.success(`Department "${newDepartment.name}" created successfully!`)
      
      // Reset form and close modal
      setNewDepartment({ 
        name: '', 
        description: '', 
        budget: 0, 
        meeting_quota: 50, 
        storage_quota_gb: 10 
      })
      setShowDepartmentModal(false)
      
      // Refresh departments list
      fetchDepartments()

    } catch (error) {
      console.error('Error creating department:', error)
      toast.error('Failed to create department')
    }
  }

  // Enhanced member management functions
  const updateMemberRole = async (memberId: string, newRole: TeamMember['role']) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) {
        console.error('Error updating member role:', error)
        toast.error('Failed to update member role')
        return
      }

      // Add audit log
      await supabase.from('audit_logs').insert({
        user_id: currentUser?.id,
        user_name: currentUser?.email || 'System',
        action: 'role_changed',
        resource: 'team_member',
        details: `Changed member role to ${newRole}`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        success: true
      })
      
      toast.success('Member role updated successfully')
      fetchTeamData()
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Failed to update member role')
    }
  }

  const removeMember = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    if (!confirm(`Are you sure you want to remove ${member.full_name} from the team? This action cannot be undone.`)) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'removed' })
        .eq('id', memberId)

      if (error) {
        console.error('Error removing member:', error)
        toast.error('Failed to remove member')
        return
      }

      // Add audit log
      await supabase.from('audit_logs').insert({
        user_id: currentUser?.id,
        user_name: currentUser?.email || 'System',
        action: 'member_removed',
        resource: 'team_member',
        details: `Removed ${member.full_name} from team`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        success: true
      })
      
      toast.success('Member removed from team')
      fetchTeamData()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const toggleMemberStatus = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    const newStatus = member.status === 'active' ? 'suspended' : 'active'
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', memberId)

      if (error) {
        console.error('Error updating member status:', error)
        toast.error('Failed to update member status')
        return
      }

      toast.success(`Member ${newStatus === 'active' ? 'activated' : 'suspended'}`)
      fetchTeamData()
    } catch (error) {
      console.error('Error updating member status:', error)
      toast.error('Failed to update member status')
    }
  }

  // Access request handling
  const handleAccessRequest = async (requestId: string, action: 'approve' | 'deny', notes?: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'denied',
          reviewed_by: currentUser?.email || 'System',
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error handling access request:', error)
        toast.error('Failed to process access request')
        return
      }
      
      toast.success(`Access request ${action === 'approve' ? 'approved' : 'denied'}`)
      fetchTeamData()
    } catch (error) {
      console.error('Error handling access request:', error)
      toast.error('Failed to process access request')
    }
  }

  const resendInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', inviteId)

      if (error) {
        console.error('Error resending invite:', error)
        toast.error('Failed to resend invite')
        return
      }

      toast.success('Invite resent successfully')
    } catch (error) {
      console.error('Error resending invite:', error)
      toast.error('Failed to resend invite')
    }
  }

  const cancelInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to cancel this invite?')) return
    
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', inviteId)

      if (error) {
        console.error('Error cancelling invite:', error)
        toast.error('Failed to cancel invite')
        return
      }

      toast.success('Invite cancelled')
      fetchTeamData()
    } catch (error) {
      console.error('Error cancelling invite:', error)
      toast.error('Failed to cancel invite')
    }
  }

  const updateTeamSettings = async (key: keyof TeamSettings, value: any) => {
    try {
      const { error } = await supabase
        .from('team_settings')
        .upsert({ [key]: value })

      if (error) {
        console.error('Error updating team settings:', error)
        toast.error('Failed to update team settings')
        return
      }

      setTeamSettings(prev => ({ ...prev, [key]: value }))
      toast.success('Team settings updated', { duration: 1000 })
    } catch (error) {
      console.error('Error updating team settings:', error)
      toast.error('Failed to update team settings')
    }
  }

  // When users perform actions
  const handleInviteUser = async () => {
    await trackUserActivity('user_invite')
  }

  const exportTeamData = async () => {
    try {
      const csvData = [
        ['Name', 'Email', 'Role', 'Department', 'Status', 'Joined', 'Last Active', 'Meetings', 'Storage (GB)'],
        ...teamMembers.map(member => [
          member.full_name,
          member.email,
          member.role,
          member.department || '',
          member.status,
          new Date(member.joined_at).toLocaleDateString(),
          new Date(member.last_active).toLocaleDateString(),
          member.usage_stats?.meetings_recorded?.toString() || '0',
          member.usage_stats?.storage_used?.toString() || '0'
        ])
      ]

      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `team-data-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      URL.revokeObjectURL(url)
      toast.success('Team data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export team data')
    }
  }

  // Enhanced filtering
  const filterMembers = (members: TeamMember[]) => {
    let filtered = members

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter)
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(member => member.department === departmentFilter)
    }

    return filtered
  }

  // UI Helper functions
  const getRoleBadge = (role: string) => {
    const config = {
      owner: { label: 'Owner', color: 'bg-purple-500/20 text-purple-700 border-purple-500/30', icon: Crown },
      admin: { label: 'Admin', color: 'bg-red-500/20 text-red-700 border-red-500/30', icon: Shield },
      member: { label: 'Member', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30', icon: Users },
      viewer: { label: 'Viewer', color: 'bg-gray-500/20 text-gray-700 border-gray-500/30', icon: Eye }
    }
    
    const { label, color, icon: IconComponent } = config[role as keyof typeof config] || config.member
    
    return (
      <Badge className={`glass-button border ${color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Active', color: 'bg-green-500/20 text-green-700 border-green-500/30', icon: CheckCircle },
      pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30', icon: Clock },
      inactive: { label: 'Inactive', color: 'bg-gray-500/20 text-gray-700 border-gray-500/30', icon: XCircle },
      suspended: { label: 'Suspended', color: 'bg-red-500/20 text-red-700 border-red-500/30', icon: Ban }
    }
    
    const { label, color, icon: IconComponent } = config[status as keyof typeof config] || config.active
    
    return (
      <Badge className={`glass-button border ${color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return time.toLocaleDateString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const filteredMembers = filterMembers(teamMembers)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="glass-card p-8 text-center backdrop-blur-md bg-white/40 rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading team information...</p>
          <p className="text-black/60 text-sm mt-2">Gathering member data, permissions, and analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Enhanced Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">Team Management</h1>
            <p className="text-xl text-black/70">
              Manage team members, departments, permissions, and collaboration settings
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                <Building className="h-3 w-3 mr-1" />
                {departments.length} Departments
              </Badge>
              <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                <TrendingUp className="h-3 w-3 mr-1" />
                {teamStats.engagementScore}% Engagement
              </Badge>
              {teamStats.growthRate > 0 && (
                <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{teamStats.growthRate}% Growth
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setShowBulkImport(true)}
              className="glass-button text-black border-black/20 hover:scale-105 transition-all backdrop-blur-md bg-white/30"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button 
              onClick={exportTeamData}
              className="glass-button text-black border-black/20 hover:scale-105 transition-all backdrop-blur-md bg-white/30"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button 
              onClick={() => setShowInviteModal(true)}
              className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Members
            </Button>
          </div>
        </div>

        {/* Enhanced Team Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="glass-card border-black/10 hover:scale-105 transition-all duration-300 backdrop-blur-md bg-white/40 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black/70 font-medium">Total Members</p>
                  <p className="text-2xl font-bold text-black">{teamStats.totalMembers}</p>
                  <p className="text-xs text-green-600 font-medium">+{teamStats.growthRate}% growth</p>
                </div>
                <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                  <Users className="h-5 w-5 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/10 hover:scale-105 transition-all duration-300 backdrop-blur-md bg-white/40 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black/70 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-600">{teamStats.activeMembers}</p>
                  <p className="text-xs text-black/50">
                    {Math.round((teamStats.activeMembers / Math.max(teamStats.totalMembers, 1)) * 100)}% of team
                  </p>
                </div>
                <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/10 hover:scale-105 transition-all duration-300 backdrop-blur-md bg-white/40 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black/70 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{teamStats.pendingInvites}</p>
                  <p className="text-xs text-black/50">awaiting response</p>
                </div>
                <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/10 hover:scale-105 transition-all duration-300 backdrop-blur-md bg-white/40 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black/70 font-medium">Meetings</p>
                  <p className="text-2xl font-bold text-blue-600">{teamStats.totalMeetings}</p>
                  <p className="text-xs text-black/50">this month</p>
                </div>
                <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                  <Mic className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/10 hover:scale-105 transition-all duration-300 backdrop-blur-md bg-white/40 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black/70 font-medium">Storage</p>
                  <p className="text-2xl font-bold text-purple-600">{teamStats.totalStorage.toFixed(1)}GB</p>
                  <p className="text-xs text-black/50">
                    {Math.round((teamStats.totalStorage / teamSettings.max_storage_gb) * 100)}% used
                  </p>
                </div>
                <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                  <HardDrive className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/10 hover:scale-105 transition-all duration-300 backdrop-blur-md bg-white/40 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black/70 font-medium">Engagement</p>
                  <p className="text-2xl font-bold text-orange-600">{teamStats.engagementScore}%</p>
                  <p className="text-xs text-black/50">team score</p>
                </div>
                <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card border-black/20 grid w-full grid-cols-6 h-12 p-1 backdrop-blur-md bg-white/40">
            <TabsTrigger value="members" className="text-black data-[state=active]:bg-black data-[state=active]:text-white text-sm font-medium px-2 py-2 rounded-md transition-all">
              Members ({teamStats.totalMembers})
            </TabsTrigger>
            <TabsTrigger value="invites" className="text-black data-[state=active]:bg-black data-[state=active]:text-white text-sm font-medium px-2 py-2 rounded-md transition-all">
              Invites ({teamStats.pendingInvites})
            </TabsTrigger>
            <TabsTrigger value="departments" className="text-black data-[state=active]:bg-black data-[state=active]:text-white text-sm font-medium px-2 py-2 rounded-md transition-all">
              Departments ({departments.length})
            </TabsTrigger>
            <TabsTrigger value="access" className="text-black data-[state=active]:bg-black data-[state=active]:text-white text-sm font-medium px-2 py-2 rounded-md transition-all">
              Access ({accessRequests.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-black data-[state=active]:bg-black data-[state=active]:text-white text-sm font-medium px-2 py-2 rounded-md transition-all">
              Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-black data-[state=active]:bg-black data-[state=active]:text-white text-sm font-medium px-2 py-2 rounded-md transition-all">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* MEMBERS TAB */}
          <TabsContent value="members" className="space-y-6">
            {/* Search and Filters */}
            <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black/40" />
                    <Input
                      placeholder="Search members by name, email, department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="glass-card pl-10 h-11 text-black placeholder:text-black/40 border-black/20 backdrop-blur-sm bg-white/30"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="glass-button text-black border-black/20 w-32 backdrop-blur-sm bg-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="glass-button text-black border-black/20 w-32 backdrop-blur-sm bg-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="glass-button text-black border-black/20 w-40 backdrop-blur-sm bg-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      onClick={() => setBulkActions(!bulkActions)}
                      className={`glass-button border-black/20 hover:scale-105 transition-all backdrop-blur-sm h-11 ${
                        bulkActions ? 'bg-black text-white' : 'text-black bg-white/30'
                      }`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <div className="space-y-4">
              {filteredMembers.length === 0 ? (
                <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
                  <CardContent className="text-center py-16">
                    <Users className="h-12 w-12 text-black/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-black mb-2">No team members yet</h3>
                    <p className="text-black/70 mb-6">Invite your first team member to get started</p>
                    <Button 
                      onClick={() => setShowInviteModal(true)}
                      className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite First Member
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredMembers.map((member) => (
                  <Card key={member.id} className="glass-card border-black/10 hover:scale-102 transition-all duration-300 backdrop-blur-md bg-white/40 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="h-12 w-12 border-2 border-black/20 shadow-lg">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                              {member.full_name.split(' ').map(n => n.charAt(0)).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-black">{member.full_name}</h3>
                              {getRoleBadge(member.role)}
                              {getStatusBadge(member.status)}
                              {member.two_factor_enabled && (
                                <Badge className="bg-green-500/20 text-green-700 border-green-500/30 flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  2FA
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-black/70 mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                                {member.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{member.phone}</span>
                                  </div>
                                )}
                                {member.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{member.location}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                {member.title && (
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{member.title}</span>
                                  </div>
                                )}
                                {member.department && (
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    <span>{member.department}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Joined {formatDate(member.joined_at)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Mic className="h-4 w-4 text-blue-600" />
                                <span className="text-black/70">{member.usage_stats?.meetings_recorded || 0}</span>
                                <span className="text-xs text-black/50">meetings</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-green-600" />
                                <span className="text-black/70">{member.usage_stats?.storage_used || 0}GB</span>
                                <span className="text-xs text-black/50">storage</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-purple-600" />
                                <span className="text-black/70">{member.usage_stats?.tasks_completed || 0}</span>
                                <span className="text-xs text-black/50">tasks</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-black/70">{formatTimeAgo(member.last_active)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {member.role !== 'owner' && (
                            <>
                              <Button
                                onClick={() => toggleMemberStatus(member.id)}
                                className={`glass-button h-9 px-3 text-sm hover:scale-105 transition-all backdrop-blur-sm ${
                                  member.status === 'active' 
                                    ? 'text-red-600 border-red-300 bg-red-50/20' 
                                    : 'text-green-600 border-green-300 bg-green-50/20'
                                }`}
                              >
                                {member.status === 'active' ? (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    Suspend
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button className="glass-button text-black border-black/20 h-9 w-9 p-0 backdrop-blur-sm bg-white/30">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                              <DropdownMenuItem className="text-black hover:bg-black/5">
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-black hover:bg-black/5">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              {member.role !== 'owner' && (
                                <>
                                  <DropdownMenuSeparator className="bg-black/10" />
                                  <DropdownMenuItem 
                                    onClick={() => updateMemberRole(member.id, 'admin')}
                                    className="text-black hover:bg-black/5"
                                    disabled={member.role === 'admin'}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => updateMemberRole(member.id, 'member')}
                                    className="text-black hover:bg-black/5"
                                    disabled={member.role === 'member'}
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    Make Member
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => updateMemberRole(member.id, 'viewer')}
                                    className="text-black hover:bg-black/5"
                                    disabled={member.role === 'viewer'}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Make Viewer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-black/10" />
                                  <DropdownMenuItem 
                                    onClick={() => removeMember(member.id)}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* INVITES TAB */}
          <TabsContent value="invites" className="space-y-6">
            <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-black flex items-center gap-3">
                      <Mail className="h-6 w-6" />
                      Team Invitations ({teamInvites.length})
                    </CardTitle>
                    <CardDescription className="text-black/70">
                      Manage team invitations and track their status
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={() => setShowBulkImport(true)}
                      className="glass-button text-black border-black/20 hover:scale-105 transition-all backdrop-blur-sm bg-white/30"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Import
                    </Button>
                    <Button 
                      onClick={() => setShowInviteModal(true)}
                      className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invite
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {teamInvites.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-black/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-black mb-2">No pending invites</h3>
                    <p className="text-black/70 mb-6">Invite team members to start collaborating</p>
                    <Button 
                      onClick={() => setShowInviteModal(true)}
                      className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                    >
                      Send First Invite
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamInvites.map((invite) => (
                      <Card key={invite.id} className="glass-card border-black/5 hover:scale-102 transition-all duration-300 backdrop-blur-sm bg-white/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                                <Mail className="h-5 w-5 text-black" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-black">{invite.email}</h4>
                                  {getRoleBadge(invite.role)}
                                  {getStatusBadge(invite.status)}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-black/70">
                                  <span>Invited by {invite.invited_by_name}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(invite.invited_at)}</span>
                                  <span>•</span>
                                  <span>Expires {formatTimeAgo(invite.expires_at)}</span>
                                </div>
                                {invite.custom_message && (
                                  <p className="text-sm text-black/60 mt-2 italic">
                                    "{invite.custom_message}"
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => resendInvite(invite.id)}
                                className="glass-button text-black border-black/20 h-8 px-3 text-sm hover:scale-105 transition-all backdrop-blur-sm bg-white/30"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Resend
                              </Button>
                              <Button 
                                onClick={() => cancelInvite(invite.id)}
                                className="glass-button text-red-600 border-red-300 h-8 px-3 text-sm hover:scale-105 transition-all backdrop-blur-sm bg-red-50/20"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEPARTMENTS TAB */}
          <TabsContent value="departments" className="space-y-6">
            <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-black flex items-center gap-3">
                      <Building className="h-6 w-6" />
                      Team Departments ({departments.length})
                    </CardTitle>
                    <CardDescription className="text-black/70">
                      Organize your team into departments with budgets and quotas
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowDepartmentModal(true)}
                    className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {departments.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 text-black/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-black mb-2">No departments yet</h3>
                    <p className="text-black/70 mb-6">Create departments to organize your team</p>
                    <Button 
                      onClick={() => setShowDepartmentModal(true)}
                      className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                    >
                      Create First Department
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((department) => (
                      <Card key={department.id} className="glass-card border-black/5 hover:scale-105 transition-all duration-300 backdrop-blur-sm bg-gradient-to-br from-white/40 to-white/20 shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="glass-button p-3 rounded-xl backdrop-blur-sm bg-white/30">
                                <Building className="h-6 w-6 text-black" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-black">{department.name}</h3>
                                <p className="text-sm text-black/70">{department.member_count || 0} members</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button className="glass-button text-black border-black/20 h-8 w-8 p-0 backdrop-blur-sm bg-white/30">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                                <DropdownMenuItem className="text-black hover:bg-black/5">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Department
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-black hover:bg-black/5">
                                  <Users className="mr-2 h-4 w-4" />
                                  Manage Members
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {department.description && (
                            <p className="text-sm text-black/70">{department.description}</p>
                          )}
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-black/70">Budget</span>
                                <span className="font-medium text-black">
                                  {formatCurrency(department.budget || 0)}
                                </span>
                              </div>
                              <Progress value={75} className="h-2 bg-black/10" />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-black/70">Meeting Quota</span>
                                <span className="font-medium text-black">
                                  {department.meeting_quota || 0} meetings
                                </span>
                              </div>
                              <Progress value={60} className="h-2 bg-black/10" />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-black/70">Storage Quota</span>
                                <span className="font-medium text-black">
                                  {department.storage_quota_gb || 0}GB
                                </span>
                              </div>
                              <Progress value={45} className="h-2 bg-black/10" />
                            </div>
                          </div>

                          <Button className="w-full glass-button text-black border-black/20 hover:scale-105 transition-all backdrop-blur-sm bg-white/30">
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACCESS TAB */}
          <TabsContent value="access" className="space-y-6">
            <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-3">
                  <Key className="h-6 w-6" />
                  Access Requests ({accessRequests.length})
                </CardTitle>
                <CardDescription className="text-black/70">
                  Review and manage permission requests from team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 text-black/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-black mb-2">No pending requests</h3>
                    <p className="text-black/70">All access requests are up to date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accessRequests.map((request) => (
                      <Card key={request.id} className="glass-card border-black/5 hover:scale-102 transition-all duration-300 backdrop-blur-sm bg-white/30">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <Avatar className="h-10 w-10 border-2 border-black/20">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm">
                                  {request.user_name.split(' ').map(n => n.charAt(0)).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-black">{request.user_name}</h4>
                                  <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                                    Pending Review
                                  </Badge>
                                  {getRoleBadge(request.requested_role)}
                                </div>
                                
                                <p className="text-sm text-black/70 mb-3">{request.user_email}</p>
                                
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm font-medium text-black mb-1">Requested Permissions:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {request.requested_permissions.map((permission) => (
                                        <Badge key={permission} className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-xs">
                                          {permission.replace('can_', '').replace('_', ' ')}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm font-medium text-black mb-1">Reason:</p>
                                    <p className="text-sm text-black/70 bg-black/5 p-2 rounded">{request.reason}</p>
                                  </div>
                                  
                                  <p className="text-xs text-black/50">
                                    Requested {formatTimeAgo(request.requested_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => handleAccessRequest(request.id, 'approve')}
                                className="glass-button text-green-600 border-green-300 h-9 px-4 text-sm hover:scale-105 transition-all backdrop-blur-sm bg-green-50/20"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                onClick={() => handleAccessRequest(request.id, 'deny')}
                                className="glass-button text-red-600 border-red-300 h-9 px-4 text-sm hover:scale-105 transition-all backdrop-blur-sm bg-red-50/20"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-3">
                  <Settings className="h-6 w-6" />
                  Team Settings
                </CardTitle>
                <CardDescription className="text-black/70">
                  Configure team permissions and collaboration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-black font-medium">Allow Member Invites</Label>
                    <p className="text-black/70 text-sm">Let team members invite new people</p>
                  </div>
                  <Switch
                    checked={teamSettings.allow_member_invites}
                    onCheckedChange={(checked) => updateTeamSettings('allow_member_invites', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-black font-medium">Require Approval</Label>
                    <p className="text-black/70 text-sm">Admin approval required for new invites</p>
                  </div>
                  <Switch
                    checked={teamSettings.require_approval_for_invites}
                    onCheckedChange={(checked) => updateTeamSettings('require_approval_for_invites', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-black font-medium">Meeting Sharing</Label>
                    <p className="text-black/70 text-sm">Share meetings with team by default</p>
                  </div>
                  <Switch
                    checked={teamSettings.meeting_sharing_default}
                    onCheckedChange={(checked) => updateTeamSettings('meeting_sharing_default', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black font-medium">Team Member Limit</Label>
                  <Input
                    type="number"
                    value={teamSettings.max_members}
                    onChange={(e) => updateTeamSettings('max_members', parseInt(e.target.value))}
                    className="glass-card border-black/20 text-black h-11 backdrop-blur-sm bg-white/30"
                    min="1"
                    max="100"
                  />
                  <p className="text-black/60 text-xs">Current: {teamStats.totalMembers} / {teamSettings.max_members}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-black font-medium">Storage Limit (GB)</Label>
                  <Input
                    type="number"
                    value={teamSettings.max_storage_gb}
                    onChange={(e) => updateTeamSettings('max_storage_gb', parseInt(e.target.value))}
                    className="glass-card border-black/20 text-black h-11 backdrop-blur-sm bg-white/30"
                    min="10"
                    max="1000"
                  />
                  <p className="text-black/60 text-xs">Used: {teamStats.totalStorage.toFixed(1)}GB</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-3">
                    <BarChart3 className="h-6 w-6" />
                    Team Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-black/70">Storage Usage</span>
                        <span className="font-medium text-black">
                          {teamStats.totalStorage.toFixed(1)}GB / {teamSettings.max_storage_gb}GB
                        </span>
                      </div>
                      <Progress value={(teamStats.totalStorage / teamSettings.max_storage_gb) * 100} className="h-2 bg-black/10" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-black/70">Team Members</span>
                        <span className="font-medium text-black">{teamStats.totalMembers} / {teamSettings.max_members}</span>
                      </div>
                      <Progress value={(teamStats.totalMembers / teamSettings.max_members) * 100} className="h-2 bg-black/10" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-black/70">Active Members</span>
                        <span className="font-medium text-black">{teamStats.activeMembers} / {teamStats.totalMembers}</span>
                      </div>
                      <Progress value={teamStats.totalMembers > 0 ? (teamStats.activeMembers / teamStats.totalMembers) * 100 : 0} className="h-2 bg-black/10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{teamStats.engagementScore}%</p>
                      <p className="text-black/70 text-sm">Engagement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{teamStats.pendingInvites}</p>
                      <p className="text-black/70 text-sm">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-3">
                    <Users className="h-6 w-6" />
                    Role Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamStats.roleDistribution.map((role, index) => (
                      <div key={role.role} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-black/70">{role.role}</span>
                          <span className="font-medium text-black">{role.count}</span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={teamStats.totalMembers > 0 ? (role.count / teamStats.totalMembers) * 100 : 0} 
                            className="h-3 bg-black/10" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <Card className="glass-card border-black/10 backdrop-blur-md bg-white/40 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-3">
                  <Activity className="h-6 w-6" />
                  Recent Team Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-black/40 mx-auto mb-4" />
                    <p className="text-black/70">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center space-x-4 p-3 glass-card hover:scale-102 transition-all backdrop-blur-sm bg-white/30 rounded-lg">
                        <div className="glass-button p-2 rounded-lg backdrop-blur-sm bg-white/30">
                          <Activity className="h-4 w-4 text-black" />
                        </div>
                        <div className="flex-1">
                          <p className="text-black">
                            <span className="font-medium">{log.user_name}</span>{' '}
                            {log.action.replace('_', ' ')}{' '}
                            {log.details && <span>{log.details}</span>}
                          </p>
                          <p className="text-black/70 text-sm">{formatTimeAgo(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODALS */}
        
        {/* Enhanced Invite Modal */}
        {showInviteModal && (
          <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
            <DialogContent className="sm:max-w-2xl glass-card border-black/20 backdrop-blur-md bg-white/40 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-3 text-xl">
                  <UserPlus className="h-6 w-6" />
                  Invite Team Members
                </DialogTitle>
                <DialogDescription className="text-black/70">
                  Send invitations to new team members or generate shareable invite links
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={sendInvites} className="space-y-8">
                {/* Invite Methods Tabs */}
                <div className="border-b border-black/10">
                  <div className="grid grid-cols-2 gap-0 mb-4">
                    <button
                      type="button"
                      onClick={() => setInviteMethod('single')}
                      className={`p-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                        inviteMethod === 'single'
                          ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                          : 'border-transparent text-black/70 hover:text-black hover:border-black/20'
                      }`}
                    >
                      📧 Single Invitation
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteMethod('bulk')}
                      className={`p-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                        inviteMethod === 'bulk'
                          ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                          : 'border-transparent text-black/70 hover:text-black hover:border-black/20'
                      }`}
                    >
                      📋 Bulk Invitations
                    </button>
                  </div>
                </div>

                {/* Single Invitation Method */}
                {inviteMethod === 'single' && (
                  <div className="space-y-6">
                    {/* Email Input for Single Invitation */}
                    <div>
                      <Label htmlFor="single-email" className="text-black font-medium text-base">Email Address</Label>
                      <input
                        type="email"
                        id="single-email"
                        value={inviteForm.singleEmail || ''}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, singleEmail: e.target.value }))}
                        className="w-full mt-2 px-4 py-3 border border-black/20 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/70 transition-all duration-300"
                        placeholder="swaraj@example.com"
                        required
                      />
                    </div>

                    {/* Beautiful Invite Link Generation Section */}
                    <div className="p-6 bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-indigo-50/60 rounded-xl border border-blue-200/40 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                            🔗 Generate Shareable Invite Link
                          </h3>
                          <p className="text-sm text-black/70 mt-1">
                            Create a link that can be shared manually via WhatsApp, Slack, or any messaging app
                          </p>
                        </div>
                      </div>
                      
                      <button
                                               type="button"
                        onClick={() => handleCopyInviteLink()}
                        className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-500 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] transform shadow-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-3">
                          <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-lg group-hover:scale-105 transition-transform duration-300">Generate & Copy Invite Link</span>
                          <div className="bg-white/20 px-3 py-1 rounded-full text-sm border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                            ⚡ Instant
                          </div>
                        </div>
                      </button>
                      
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-black/60">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                        </svg>
                        Perfect when email delivery is unavailable • Link expires in 7 days
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk Invitation Method */}
                {inviteMethod === 'bulk' && (
                  <div>
                    <Label htmlFor="emails" className="text-black font-medium text-base">Email Addresses (Bulk)</Label>
                    <Textarea
                      id="emails"
                      value={inviteForm.emails}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, emails: e.target.value }))}
                      className="glass-card border-black/20 text-black mt-2 min-h-[120px] backdrop-blur-sm bg-white/70 transition-all duration-300 focus:bg-white/90"
                      placeholder={`Enter multiple email addresses (one per line or comma-separated)\nswaraj@example.com\nakash@example.com\nrahul@company.com`}
                      required
                    />
                    <p className="text-xs text-black/60 mt-1">
                      Enter multiple emails separated by commas or new lines
                    </p>
                  </div>
                )}

                {/* Common Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role" className="text-black font-medium text-base">Role</Label>
                    <Select 
                      value={inviteForm.role} 
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as any }))}
                    >
                      <SelectTrigger className="glass-button text-black border-black/20 mt-2 h-12 backdrop-blur-sm bg-white/70 hover:bg-white/90 transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-red-500" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>Member</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <span>Viewer</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-black font-medium text-base">Department</Label>
                    <Select 
                      value={inviteForm.department} 
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger className="glass-button text-black border-black/20 mt-2 h-12 backdrop-blur-sm bg-white/70 hover:bg-white/90 transition-all duration-300">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-purple-500" />
                              <span>{dept.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-black font-medium text-base">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    className="glass-card border-black/20 text-black mt-2 backdrop-blur-sm bg-white/70 transition-all duration-300 focus:bg-white/90"
                    placeholder="Welcome to our team! We're excited to have you on board and look forward to working together..."
                    rows={3}
                  />
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-black/10">
                  <Button 
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 glass-button text-black border-black/20 hover:scale-105 hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/50 py-3 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 group relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white hover:from-green-700 hover:via-emerald-700 hover:to-green-800 hover:scale-105 transition-all duration-300 shadow-lg py-3 rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      <span className="font-semibold">
                        {inviteMethod === 'single' ? 'Send Invitation' : 'Send Bulk Invitations'}
                      </span>
                    </div>
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
            <DialogContent className="sm:max-w-2xl glass-card border-black/20 backdrop-blur-md bg-white/40 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-3">
                  <Upload className="h-6 w-6" />
                  Bulk Import Team Members
                </DialogTitle>
                <DialogDescription className="text-black/70">
                  Import multiple team members at once using CSV format
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="glass-card p-4 border border-blue-500/20 bg-blue-50/20 backdrop-blur-sm">
                  <h4 className="font-semibold text-black mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    CSV Format Example
                  </h4>
                  <div className="bg-black/5 p-3 rounded text-sm font-mono text-black">
                    email,name,role,department<br/>
                    swaraj@example.com,Swaraj Smith,member,Engineering<br/>
                    akash@example.com,Akash Johnson,admin,Marketing
                  </div>
                </div>

                <div>
                  <Label className="text-black font-medium">CSV Content</Label>
                  <Textarea
                    value={bulkImportData.csv_content}
                    onChange={(e) => setBulkImportData(prev => ({ ...prev, csv_content: e.target.value }))}
                    className="glass-card border-black/20 text-black mt-1 min-h-[200px] font-mono text-sm backdrop-blur-sm bg-white/30"
                    placeholder="Paste your CSV content here..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black font-medium">Default Role</Label>
                    <Select 
                      value={bulkImportData.default_role} 
                      onValueChange={(value) => setBulkImportData(prev => ({ ...prev, default_role: value as any }))}
                    >
                      <SelectTrigger className="glass-button text-black border-black/20 mt-1 h-11 backdrop-blur-sm bg-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bulkImportData.auto_send_invites}
                        onCheckedChange={(checked) => setBulkImportData(prev => ({ ...prev, auto_send_invites: checked }))}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <Label className="text-black font-medium">Auto-send invites</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bulkImportData.skip_validation}
                        onCheckedChange={(checked) => setBulkImportData(prev => ({ ...prev, skip_validation: checked }))}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <Label className="text-black font-medium">Skip validation</Label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button"
                    onClick={() => setShowBulkImport(false)}
                    className="flex-1 glass-button text-black border-black/20 hover:scale-105 transition-all backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={processBulkImport}
                    className="flex-1 bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Members
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Department Modal */}
        {showDepartmentModal && (
          <Dialog open={showDepartmentModal} onOpenChange={setShowDepartmentModal}>
            <DialogContent className="sm:max-w-lg glass-card border-black/20 backdrop-blur-md bg-white/40 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-3">
                  <Building className="h-6 w-6" />
                  Create New Department
                </DialogTitle>
                <DialogDescription className="text-black/70">
                  Add a new department to organize your team members
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-black font-medium">Department Name</Label>
                  <Input
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-card border-black/20 text-black mt-1 h-11 backdrop-blur-sm bg-white/30"
                    placeholder="e.g., Engineering, Marketing, Sales"
                    required
                  />
                </div>

                <div>
                  <Label className="text-black font-medium">Description (Optional)</Label>
                  <Textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                    className="glass-card border-black/20 text-black mt-1 backdrop-blur-sm bg-white/30"
                    placeholder="Brief description of the department's role..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-black font-medium">Budget ($)</Label>
                    <Input
                      type="number"
                      value={newDepartment.budget}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                      className="glass-card border-black/20 text-black mt-1 h-11 backdrop-blur-sm bg-white/30"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label className="text-black font-medium">Meeting Quota</Label>
                    <Input
                      type="number"
                      value={newDepartment.meeting_quota}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, meeting_quota: parseInt(e.target.value) || 50 }))}
                      className="glass-card border-black/20 text-black mt-1 h-11 backdrop-blur-sm bg-white/30"
                      min="1"
                    />
                  </div>

                  <div>
                    <Label className="text-black font-medium">Storage (GB)</Label>
                    <Input
                      type="number"
                      value={newDepartment.storage_quota_gb}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, storage_quota_gb: parseInt(e.target.value) || 10 }))}
                      className="glass-card border-black/20 text-black mt-1 h-11 backdrop-blur-sm bg-white/30"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button"
                    onClick={() => setShowDepartmentModal(false)}
                    className="flex-1 glass-button text-black border-black/20 hover:scale-105 transition-all backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createDepartment}
                    className="flex-1 bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Department
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Access Request Modal */}
        {showAccessRequestModal && (
          <Dialog open={showAccessRequestModal} onOpenChange={setShowAccessRequestModal}>
            <DialogContent className="sm:max-w-lg glass-card border-black/20 backdrop-blur-md bg-white/40 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-3">
                  <Key className="h-6 w-6" />
                  Request Additional Access
                </DialogTitle>
                <DialogDescription className="text-black/70">
                  Submit a request for additional permissions or role changes
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-black font-medium">Requested Role</Label>
                  <Select>
                    <SelectTrigger className="glass-button text-black border-black/20 mt-1 h-11 backdrop-blur-sm bg-white/30">
                      <SelectValue placeholder="Select desired role" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-black/20 backdrop-blur-md bg-white/90">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-black font-medium">Additional Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['can_record', 'can_invite', 'can_delete', 'can_export', 'can_view_analytics', 'can_manage_integrations'].map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <input type="checkbox" id={permission} className="rounded" />
                        <Label htmlFor={permission} className="text-sm text-black/70">
                          {permission.replace('can_', '').replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-black font-medium">Justification</Label>
                  <Textarea
                    className="glass-card border-black/20 text-black mt-1 backdrop-blur-sm bg-white/30"
                    placeholder="Please explain why you need these permissions..."
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button"
                    onClick={() => setShowAccessRequestModal(false)}
                    className="flex-1 glass-button text-black border-black/20 hover:scale-105 transition-all backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Enhanced Quick Actions Floating Panel */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => setShowAccessRequestModal(true)}
              className="group glass-card backdrop-blur-md bg-white/60 text-black border border-black/20 hover:scale-110 hover:bg-white/80 hover:shadow-xl transition-all duration-300 h-14 w-14 rounded-full p-0"
              title="Request Access"
            >
              <Key className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
            </Button>
            
            <Button 
              onClick={exportTeamData}
              className="group glass-card backdrop-blur-md bg-white/60 text-black border border-black/20 hover:scale-110 hover:bg-white/80 hover:shadow-xl transition-all duration-300 h-14 w-14 rounded-full p-0"
              title="Export Data"
            >
              <Download className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
            </Button>
            
            <Button 
              onClick={() => {
                fetchTeamData()
                toast.info('Team data refreshed!')
              }}
              className="group glass-card backdrop-blur-md bg-white/60 text-black border border-black/20 hover:scale-110 hover:bg-white/80 hover:shadow-xl transition-all duration-300 h-14 w-14 rounded-full p-0"
              title="Refresh Data"
            >
              <RefreshCw className="h-6 w-6 group-hover:scale-110 group-hover:rotate-180 transition-all duration-500" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
