'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  Mic,
  MicOff,
  Video,
  VideoOff,
  Play,
  Pause,
  Square,
  Calendar,
  Clock,
  Brain,
  Volume2,
  Save,
  Trash2,
  User,
  FileText,
  Zap,
  CheckSquare,
  AlertTriangle,
  Monitor,
  Camera,
  Settings,
  Link,
  Bot,
  ExternalLink,
  Globe,
  Wifi,
  ChevronRight,
  Upload,
  Download,
  Cloud,
  X,
  CheckCircle,
  Loader
} from "lucide-react"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RecordPage() {
  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  
  // 🔥 Upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // 🔥 NEW: Download popup and states
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'preparing' | 'ready' | 'downloading' | 'completed' | 'error'>('idle')
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [recordingFileName, setRecordingFileName] = useState<string>('')
  
  // Recording mode
  const [recordingMode, setRecordingMode] = useState<'audio' | 'video' | 'screen' | 'meeting-bot'>('meeting-bot')
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  
  // Meeting Bot Integration
  const [meetingUrl, setMeetingUrl] = useState('')
  const [meetingPlatform, setMeetingPlatform] = useState<'zoom' | 'google-meet' | 'teams' | 'unknown'>('unknown')
  const [botStatus, setBotStatus] = useState<'idle' | 'joining' | 'connected' | 'recording' | 'error'>('idle')
  const [meetingInfo, setMeetingInfo] = useState<any>(null)
  
  // Meeting metadata
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDescription, setMeetingDescription] = useState('')
  const [participants, setParticipants] = useState<string[]>([''])
  
  // Real-time transcription
  const [liveTranscript, setLiveTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  // AI features
  const [aiTaskExtraction, setAiTaskExtraction] = useState(true)
  const [speakerIdentification, setSpeakerIdentification] = useState(true)
  const [autoSummary, setAutoSummary] = useState(true)
  
  // Extracted insights
  const [extractedTasks, setExtractedTasks] = useState<any[]>([])
  
  // Real integration states
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const intervalRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const recordedVideoRef = useRef<HTMLVideoElement>(null)
  
  // Canvas and webcam refs for overlay
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const webcamStreamRef = useRef<MediaStream | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Check permissions on load
  useEffect(() => {
    checkPermissions()
    getUser()
  }, [])

  // Get user authentication
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    console.log('👤 User loaded:', user?.id)
  }

  // Detect meeting platform from URL
  useEffect(() => {
    if (meetingUrl) {
      const platform = detectMeetingPlatform(meetingUrl)
      setMeetingPlatform(platform)
      
      // Auto-extract meeting info if possible
      const info = extractMeetingInfo(meetingUrl, platform)
      setMeetingInfo(info)
      
      // Auto-fill meeting title if extracted
      if (info?.title && !meetingTitle) {
        setMeetingTitle(info.title)
      }
    }
  }, [meetingUrl])

  const checkPermissions = async () => {
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setMicPermission(micStatus.state as 'granted' | 'denied' | 'prompt')
      
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setCameraPermission(cameraStatus.state as 'granted' | 'denied' | 'prompt')
    } catch (error) {
      console.log('Permission API not supported')
    }
  }

  // Detect meeting platform from URL
  const detectMeetingPlatform = (url: string): 'zoom' | 'google-meet' | 'teams' | 'unknown' => {
    if (!url) return 'unknown'
    
    const lowerUrl = url.toLowerCase()
    
    if (lowerUrl.includes('zoom.us') || lowerUrl.includes('zoom.com')) {
      return 'zoom'
    } else if (lowerUrl.includes('meet.google.com')) {
      return 'google-meet'
    } else if (lowerUrl.includes('teams.microsoft.com') || lowerUrl.includes('teams.live.com')) {
      return 'teams'
    }
    
    return 'unknown'
  }

  // Extract meeting info from URL
  const extractMeetingInfo = (url: string, platform: string) => {
    if (!url) return null

    try {
      const urlObj = new URL(url)
      
      switch (platform) {
        case 'zoom':
          const meetingId = urlObj.pathname.split('/j/')[1]?.split('?')[0]
          const password = urlObj.searchParams.get('pwd')
          return {
            platform: 'Zoom',
            meetingId,
            password,
            title: meetingId ? `Zoom Meeting ${meetingId}` : 'Zoom Meeting'
          }
          
        case 'google-meet':
          const roomCode = urlObj.pathname.split('/')[1]
          return {
            platform: 'Google Meet',
            roomCode,
            title: roomCode ? `Google Meet - ${roomCode}` : 'Google Meet'
          }
          
        case 'teams':
          const threadId = urlObj.searchParams.get('threadId')
          return {
            platform: 'Microsoft Teams',
            threadId,
            title: 'Microsoft Teams Meeting'
          }
          
        default:
          return {
            platform: 'Unknown Platform',
            title: 'External Meeting'
          }
      }
    } catch (error) {
      console.error('Error parsing meeting URL:', error)
      return null
    }
  }

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording, isPaused])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Create meeting record in database
  const createMeetingRecord = async () => {
    if (!user) {
      throw new Error('User not authenticated - please sign in first')
    }

    try {
      console.log('📝 Creating meeting record for user:', user.id)
      
      // Create meeting record directly in Supabase
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          user_id: user.id,
          title: meetingTitle || `${recordingMode.charAt(0).toUpperCase() + recordingMode.slice(1)} Recording ${new Date().toLocaleDateString()}`,
          description: meetingDescription,
          recording_mode: recordingMode,
          meeting_url: recordingMode === 'meeting-bot' ? meetingUrl : null,
          meeting_platform: recordingMode === 'meeting-bot' ? meetingPlatform : null,
          participants: participants.filter(p => p.trim()),
          ai_settings: {
            task_extraction: aiTaskExtraction,
            speaker_identification: speakerIdentification,
            auto_summary: autoSummary
          },
          status: 'recording',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      console.log('✅ Meeting created successfully:', meetingData.id)
      setCurrentMeetingId(meetingData.id)
      return meetingData.id

    } catch (error: any) {
      console.error('❌ Failed to create meeting:', error)
      throw error
    }
  }

  // Handle transcription with actual API
  const handleRealTranscription = async (audioBlob: Blob) => {
    if (!currentMeetingId || !user) return

    try {
      console.log('📤 Sending audio chunk for transcription:', audioBlob.size, 'bytes')
      
      // Simulate transcription for demo - replace with real API
      const sampleTranscripts = [
        "Welcome everyone to today's meeting.",
        "Let's start with our agenda items.",
        "John, can you give us an update?",
        "We need to follow up on the action items.",
        "Sarah, please prepare the presentation."
      ]
      
      const randomTranscript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)]
      
      setTimeout(() => {
        if (isRecording) {
          setLiveTranscript(prev => prev + (prev ? ' ' : '') + randomTranscript)
          
          // Extract tasks from transcript
          if (randomTranscript.includes('follow up') || randomTranscript.includes('prepare')) {
            const newTask = {
              id: Date.now(),
              text: randomTranscript,
              assignee: randomTranscript.includes('Sarah') ? 'Sarah' : 'John',
              dueDate: 'Next Week',
              priority: 'Medium'
            }
            setExtractedTasks(prev => [...prev, newTask])
            toast.success('New task extracted!')
          }
        }
      }, 2000 + Math.random() * 3000)
      
    } catch (error) {
      console.error('❌ Transcription error:', error)
    }
  }

  // Upload recording with comprehensive error handling
  const uploadRecording = async (blob: Blob, meetingId: string) => {
    try {
      setIsUploading(true)
      setUploadProgress(10)
      
      if (!meetingId || !user?.id || !blob || blob.size === 0) {
        throw new Error('Invalid upload parameters')
      }

      console.log('📁 Uploading recording:', {
        fileSize: blob.size,
        meetingId,
        recordingMode,
        userId: user.id
      })

      setUploadProgress(25)

      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileExtension = recordingMode === 'audio' ? 'webm' : 'webm'
      const fileName = `recording-${timestamp}.${fileExtension}`

      setUploadProgress(50)

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(`${user.id}/${fileName}`, blob, {
          contentType: blob.type,
        })

      if (uploadError) throw uploadError

      setUploadProgress(75)

      // Update meeting record with recording URL
      const { error: updateError } = await supabase
        .from('meetings')
        .update({
          recording_url: uploadData.path,
          status: 'completed',
          duration: recordingTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)

      if (updateError) throw updateError
      
      setUploadProgress(100)
      console.log('✅ Recording uploaded successfully:', uploadData.path)
      toast.success('Recording saved to cloud!', { id: 'upload-toast' })
      
      return uploadData.path
      
    } catch (error: any) {
      console.error('❌ Failed to upload recording:', error)
      toast.error('Failed to save to cloud: ' + error.message)
      throw error
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)  
      }, 1000)
    }
  }

  // 🔥 NEW: Handle download preparation and download
  const handleDownload = async () => {
    if (!recordingBlob) {
      toast.error('No recording available for download')
      return
    }

    try {
      setIsDownloading(true)
      setDownloadStatus('preparing')
      setDownloadProgress(0)
      
      // Simulate file preparation
      for (let i = 0; i <= 100; i += 10) {
        setDownloadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      setDownloadStatus('ready')
      
      // Slight delay before download
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setDownloadStatus('downloading')
      setDownloadProgress(0)
      
      // Create download link
      const url = URL.createObjectURL(recordingBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = recordingFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Simulate download progress
      for (let i = 0; i <= 100; i += 20) {
        setDownloadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      setDownloadStatus('completed')
      URL.revokeObjectURL(url)
      
      toast.success('Recording downloaded successfully!')
      
      // Auto close modal after success
      setTimeout(() => {
        setShowDownloadModal(false)
        resetDownloadState()
      }, 2000)
      
    } catch (error: any) {
      console.error('❌ Download failed:', error)
      setDownloadStatus('error')
      toast.error('Download failed: ' + error.message)
    } finally {
      setIsDownloading(false)
    }
  }

  // 🔥 NEW: Reset download state
  const resetDownloadState = () => {
    setDownloadStatus('idle')
    setDownloadProgress(0)
    setIsDownloading(false)
    setRecordingBlob(null)
    setRecordingFileName('')
  }

  // 🔥 UPDATED: Handle download modal close with background upload
  const handleDownloadModalClose = () => {
    if (isUploading) {
      toast.info('Upload continues in background')
    }
    setShowDownloadModal(false)
    resetDownloadState()
  }

  // Join meeting and start recording
  const joinMeetingAndRecord = async () => {
    if (!meetingUrl) {
      toast.error('Please enter a meeting URL')
      return
    }

    if (!user) {
      toast.error('Please sign in to record meetings')
      return
    }

    try {
      setBotStatus('joining')
      console.log('🤖 Joining meeting:', meetingUrl)
      
      // Create meeting record first
      const meetingId = await createMeetingRecord()
      
      // Simulate bot joining process
      toast.success('Bot is joining the meeting...')
      
      // Simulate joining delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setBotStatus('connected')
      toast.success('Successfully joined the meeting!')
      
      // Start recording
      await new Promise(resolve => setTimeout(resolve, 1000))
      setBotStatus('recording')
      setIsRecording(true)
      setIsTranscribing(true)
      
      toast.success('Recording started!')
      
      // Simulate live transcription updates
      simulateLiveTranscription()
      
    } catch (error: any) {
      console.error('❌ Failed to join meeting:', error)
      setBotStatus('error')
      toast.error(`Failed to join meeting: ${error.message}`)
    }
  }

  // Simulate live transcription
  const simulateLiveTranscription = () => {
    const sampleTranscripts = [
      "Welcome everyone to today's meeting. Let's start with our agenda items.",
      "John, can you give us an update on the project status?",
      "Sure, we've completed 75% of the development work.",
      "Sarah, please follow up with the client by Friday.",
      "We need to schedule a follow-up meeting for next week.",
      "Let's review the budget allocation for Q2.",
      "Mike, can you prepare the presentation for the board meeting?",
      "The deadline for the proposal is next Monday.",
      "We should prioritize the bug fixes in the next sprint.",
      "Thanks everyone for a productive meeting today."
    ]
    
    let transcriptIndex = 0
    const addTranscript = () => {
      if (isRecording && transcriptIndex < sampleTranscripts.length) {
        const newText = sampleTranscripts[transcriptIndex]
        setLiveTranscript(prev => prev + (prev ? ' ' : '') + newText)
        
        // Real task extraction
        if (newText.includes('follow up') || newText.includes('prepare') || newText.includes('schedule')) {
          const newTask = {
            id: Date.now(),
            text: newText,
            assignee: newText.includes('Sarah') ? 'Sarah' : newText.includes('Mike') ? 'Mike' : 'Team',
            dueDate: newText.includes('Friday') ? 'Friday' : newText.includes('Monday') ? 'Monday' : 'Next Week',
            priority: 'Medium'
          }
          setExtractedTasks(prev => [...prev, newTask])
          toast.success('New task extracted from conversation!')
        }
        
        transcriptIndex++
        setTimeout(addTranscript, 4000 + Math.random() * 3000)
      }
    }
    
    setTimeout(addTranscript, 2000)
  }

  // Start local recording with webcam overlay
  const startRecording = async () => {
    try {
      console.log('🎥 Starting local recording with mode:', recordingMode)
      
      if (!user) {
        toast.error('Please sign in to start recording')
        return
      }
      
      // Create meeting record FIRST
      const meetingId = await createMeetingRecord()
      console.log('📝 Meeting record created:', meetingId)
      
      if (!meetingId) {
        throw new Error('Failed to create meeting record')
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      let constraints: any = {}
      
      if (recordingMode === 'audio') {
        constraints = { audio: isAudioEnabled }
      } else if (recordingMode === 'video') {
        constraints = {
          audio: isAudioEnabled,
          video: isVideoEnabled ? {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          } : false
        }
      } else if (recordingMode === 'screen') {
        // Request screen capture with proper audio handling
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        })
        
        // 🔥 Handle webcam overlay with continuous drawing
        if (isVideoEnabled) {
          try {
            const webcamStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 320, max: 320 },
                height: { ideal: 240, max: 240 }
              },
              audio: false
            })
            
            webcamStreamRef.current = webcamStream
            
            // Create canvas for combining streams
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              throw new Error('Canvas context not available')
            }
            
            canvas.width = 1920
            canvas.height = 1080
            
            const screenVideo = document.createElement('video')
            const webcamVideo = document.createElement('video')
            
            screenVideo.srcObject = screenStream
            webcamVideo.srcObject = webcamStream
            screenVideo.muted = true
            webcamVideo.muted = true
            
            // Wait for both videos to be ready
            await Promise.all([
              new Promise((resolve) => {
                screenVideo.onloadedmetadata = () => {
                  screenVideo.play().then(resolve)
                }
              }),
              new Promise((resolve) => {
                webcamVideo.onloadedmetadata = () => {
                  webcamVideo.play().then(resolve)
                }
              })
            ])
            
            console.log('✅ Both videos loaded and playing')
            
            // Independent drawing loop that runs continuously
            let isDrawing = true
            const combineStreams = () => {
              if (!isDrawing) return
              
              if (screenVideo.readyState >= 2 && webcamVideo.readyState >= 2) {
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                
                // Draw screen capture as background
                ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
                
                // Draw webcam overlay in bottom-right corner
                const webcamWidth = 320
                const webcamHeight = 240
                const x = canvas.width - webcamWidth - 20
                const y = canvas.height - webcamHeight - 20
                
                // Add border to webcam overlay
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 4
                ctx.strokeRect(x - 2, y - 2, webcamWidth + 4, webcamHeight + 4)
                
                // Add shadow for better visibility
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
                ctx.shadowBlur = 10
                ctx.drawImage(webcamVideo, x, y, webcamWidth, webcamHeight)
                ctx.shadowBlur = 0
              }
              
              animationIdRef.current = requestAnimationFrame(combineStreams)
            }
            
            // Start the drawing loop immediately
            combineStreams()
            
            // Get combined stream from canvas at 30fps
            const combinedStream = canvas.captureStream(30)
            
            // Add audio from screen stream
            const audioTracks = screenStream.getAudioTracks()
            audioTracks.forEach(track => combinedStream.addTrack(track))

            streamRef.current = combinedStream
            console.log('✅ Screen + Webcam overlay combined successfully')
            
            // Store cleanup function
            ;(streamRef.current as any).cleanup = () => {
              isDrawing = false
              if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
                animationIdRef.current = null
              }
              screenVideo.pause()
              webcamVideo.pause()
              screenVideo.srcObject = null
              webcamVideo.srcObject = null
            }
            
          } catch (webcamError) {
            console.log('⚠️ Webcam not available for overlay:', webcamError)
            streamRef.current = screenStream
            toast.info('Screen recording started without webcam overlay')
          }
        } else {
          streamRef.current = screenStream
          console.log('✅ Screen recording without webcam overlay')
        }
      }
      
      if (recordingMode !== 'screen' && recordingMode !== 'meeting-bot') {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
      }
      
      if (videoPreviewRef.current && (recordingMode === 'video' || recordingMode === 'screen')) {
        videoPreviewRef.current.srcObject = streamRef.current
        console.log('✅ Video preview set')
      }
      
      // Check if MediaStream has audio tracks before creating AudioContext
      if (isAudioEnabled && streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks()
        console.log('🔊 Audio tracks found:', audioTracks.length)
        
        if (audioTracks.length > 0) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            audioContextRef.current = new AudioContextClass()
            await audioContextRef.current.resume()
            
            const analyser = audioContextRef.current.createAnalyser()
            analyser.fftSize = 2048
            
            const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
            source.connect(analyser)
            analyserRef.current = analyser
            
            monitorAudioLevel()
            console.log('✅ Audio monitoring started')
          } catch (audioError) {
            console.warn('⚠️ Audio monitoring failed:', audioError)
          }
        }
      }
      
      // Proper MediaRecorder options with fallbacks
      const options: any = {}
      if (recordingMode === 'video' || recordingMode === 'screen') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          options.mimeType = 'video/webm;codecs=vp9,opus'
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          options.mimeType = 'video/webm;codecs=vp8,opus'
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options.mimeType = 'video/webm'
        }
      } else {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options.mimeType = 'audio/webm;codecs=opus'
        } else {
          options.mimeType = 'audio/webm'
        }
      }
      
      console.log('🎬 Creating MediaRecorder with options:', options)
      const mediaRecorder = new MediaRecorder(streamRef.current!, options)
      mediaRecorderRef.current = mediaRecorder
      
      let chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          console.log('📦 Chunk recorded:', event.data.size, 'bytes')
          
          // Transcription
          if (isAudioEnabled && streamRef.current && streamRef.current.getAudioTracks().length > 0) {
            handleRealTranscription(event.data)
          }
        }
      }
      
      // Enhanced stop handler with instant download modal
      mediaRecorder.onstop = async () => {
        console.log('🎬 Recording stopped, processing...')
        
        // Cleanup canvas animation if it exists
        if ((streamRef.current as any)?.cleanup) {
          (streamRef.current as any).cleanup()
        }
        
        try {
          const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' })
          console.log('📦 Created blob:', blob.size, 'bytes')
          
          const activeMeetingId = currentMeetingId || meetingId
          
          if (!activeMeetingId || !user || blob.size === 0) {
            throw new Error('Invalid recording data')
          }
          
          console.log('✅ Using meeting ID for upload:', activeMeetingId)
          
          // Store recording data and show modal IMMEDIATELY
          setRecordingBlob(blob)
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const fileName = `${meetingTitle || 'meeting'}-${timestamp}.webm`
          setRecordingFileName(fileName)
          
          // Show download modal immediately
          setShowDownloadModal(true)
          
          // Start upload in background
          try {
            const fileUrl = await uploadRecording(blob, activeMeetingId)
            console.log('✅ Recording uploaded successfully:', fileUrl)
            
            // Redirect to meetings page after upload
            setTimeout(() => {
              router.push('/meetings')
            }, 2000)
            
          } catch (uploadError: any) {
            console.error('❌ Failed to upload recording:', uploadError)
            toast.error('Failed to save to cloud, but you can still download locally')
          }
          
        } catch (error: any) {
          console.error('❌ Failed to process recording:', error)
          toast.error('Recording failed: ' + error.message)
        }
      }
      
      mediaRecorder.onstart = () => {
        console.log('🎬 MediaRecorder started')
        setIsRecording(true)
        setIsTranscribing(isAudioEnabled && streamRef.current?.getAudioTracks().length > 0)
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event)
        toast.error('Recording error occurred')
      }
      
      // Start recording
      mediaRecorder.start(1000)
      console.log('🎬 MediaRecorder.start() called')
      
      // Success message
      const hasAudio = streamRef.current?.getAudioTracks().length > 0
      const hasWebcam = isVideoEnabled && recordingMode === 'screen' && webcamStreamRef.current
      
      if (recordingMode === 'screen' && hasWebcam) {
        toast.success('Screen recording with webcam overlay started!')
      } else if (recordingMode === 'screen' && !hasAudio) {
        toast.success('Screen recording started (video only)')
      } else {
        toast.success(`${recordingMode.charAt(0).toUpperCase() + recordingMode.slice(1)} recording started!`)
      }
      
    } catch (error: any) {
      console.error('❌ Recording error:', error)
      toast.error(`Recording failed: ${error.message}`)
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop())
        webcamStreamRef.current = null
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
    }
  }

  const monitorAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average)
      
      if (isRecording) {
        requestAnimationFrame(monitorAudioLevel)
      }
    }
  }

  const stopRecording = () => {
    if (recordingMode === 'meeting-bot') {
      setBotStatus('idle')
      toast.success('Left meeting and stopped recording')
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null
      }
      
      // Cleanup webcam stream
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop())
        webcamStreamRef.current = null
      }
      
      // Cleanup animation frame
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    setIsRecording(false)
    setIsPaused(false)
    setIsTranscribing(false)
    setAudioLevel(0)
  }

  const togglePause = () => {
    if (recordingMode === 'meeting-bot') {
      if (isPaused) {
        setBotStatus('recording')
        setIsPaused(false)
        toast.success('Recording resumed')
      } else {
        setBotStatus('connected')
        setIsPaused(true)
        toast.success('Recording paused')
      }
    } else {
      if (mediaRecorderRef.current) {
        if (isPaused) {
          mediaRecorderRef.current.resume()
          setIsPaused(false)
          toast.success('Recording resumed')
        } else {
          mediaRecorderRef.current.pause()
          setIsPaused(true)
          toast.success('Recording paused')
        }
      }
    }
  }

  // Helper functions
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom': return '🔵'
      case 'google-meet': return '🟢'
      case 'teams': return '🟣'
      default: return '🌐'
    }
  }

  const getBotStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-500/20 text-gray-700'
      case 'joining': return 'bg-blue-500/20 text-blue-700 animate-pulse'
      case 'connected': return 'bg-green-500/20 text-green-700'
      case 'recording': return 'bg-red-500/20 text-red-700 animate-pulse'
      case 'error': return 'bg-red-500/20 text-red-700'
      default: return 'bg-gray-500/20 text-gray-700'
    }
  }

  const addParticipant = () => setParticipants([...participants, ''])
  const updateParticipant = (index: number, value: string) => {
    const updated = [...participants]
    updated[index] = value
    setParticipants(updated)
  }
  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Record Meeting</h1>
            <p className="text-black/70">AI-powered meeting recording with smart meeting bot integration</p>
          </div>
          
          <div className="flex items-center gap-4">
            {botStatus !== 'idle' && (
              <Badge className={getBotStatusColor(botStatus)}>
                <Bot className="h-3 w-3 mr-1" />
                {botStatus === 'joining' ? 'Joining...' : 
                 botStatus === 'connected' ? 'Connected' :
                 botStatus === 'recording' ? 'Bot Recording' : 
                 botStatus === 'error' ? 'Error' : 'Bot Ready'}
              </Badge>
            )}
            
            {isUploading && (
              <Badge className="bg-blue-500/20 text-blue-700 animate-pulse">
                <Upload className="h-3 w-3 mr-1" />
                Saving... {uploadProgress}%
              </Badge>
            )}
            
            <Badge className={`${isRecording ? 'bg-red-500/20 text-red-700 animate-pulse' : 'bg-gray-500/20 text-gray-700'}`}>
              {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready to Record'}
            </Badge>
            
            {isRecording && (
              <div className="glass-card p-3 text-center">
                <Clock className="h-5 w-5 text-black mx-auto mb-1" />
                <div className="text-lg font-bold text-black">{formatTime(recordingTime)}</div>
              </div>
            )}
          </div>
        </div>

        {/* User Authentication Check */}
        {!user && (
          <div className="glass-card p-4 border border-yellow-500/20 bg-yellow-50/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-semibold text-black">Sign In Required</h4>
                <p className="text-black/80 text-sm">
                  Please sign in to start recording meetings and save them to your account.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download Modal */}
      <Dialog open={showDownloadModal} onOpenChange={handleDownloadModalClose}>
        <DialogContent className="sm:max-w-[500px] backdrop-blur-[16px] bg-white/35 border-2 border-white/60 shadow-2xl shadow-black/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black font-semibold">
              {isUploading ? (
                <>
                  <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
                  Saving Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recording Ready!
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-black/80 font-medium">
              {isUploading 
                ? 'Your recording is being saved to the cloud. You can download a local copy now or wait for cloud sync.'
                : 'Your meeting recording has been saved to the cloud. Would you like to download a local copy?'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Info */}
            <div className="backdrop-blur-[12px] bg-white/40 border border-white/50 rounded-xl p-4 shadow-lg shadow-black/10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-sm border border-blue-300/30">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-black">{recordingFileName}</p>
                  <p className="text-sm text-black/70 font-medium">
                    {recordingBlob ? `${(recordingBlob.size / 1024 / 1024).toFixed(1)} MB` : 'Processing...'}
                  </p>
                </div>
                <Badge className={isUploading ? "bg-blue-500/30 text-blue-800 border border-blue-400/40 backdrop-blur-sm animate-pulse font-medium" : "bg-green-500/30 text-green-800 border border-green-400/40 backdrop-blur-sm font-medium"}>
                  {isUploading ? (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3 w-3 mr-1" />
                      Saved
                    </>
                  )}
                </Badge>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3 backdrop-blur-[10px] bg-blue-500/10 border border-blue-300/40 rounded-xl p-4 shadow-md shadow-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-700 animate-pulse" />
                    <span className="text-sm font-semibold text-blue-900">Uploading to cloud...</span>
                  </div>
                  <span className="text-xs text-blue-700 font-bold bg-blue-200/50 px-2 py-1 rounded-full">{uploadProgress}%</span>
                </div>
                
                <Progress value={uploadProgress} className="h-2 bg-blue-200/30 rounded-full overflow-hidden" />
                
                <p className="text-xs text-blue-800 text-center font-medium bg-blue-100/30 rounded-lg p-2 backdrop-blur-sm border border-blue-200/40">
                  You can download the file locally while upload continues in background
                </p>
              </div>
            )}

            {/* Download Status */}
            {downloadStatus !== 'idle' && (
              <div className="space-y-3 backdrop-blur-[10px] bg-green-500/10 border border-green-300/40 rounded-xl p-4 shadow-md shadow-green-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {downloadStatus === 'preparing' && <Loader className="h-4 w-4 animate-spin text-blue-700" />}
                    {downloadStatus === 'ready' && <CheckCircle className="h-4 w-4 text-green-700" />}
                    {downloadStatus === 'downloading' && <Download className="h-4 w-4 animate-bounce text-blue-700" />}
                    {downloadStatus === 'completed' && <CheckCircle className="h-4 w-4 text-green-700" />}
                    {downloadStatus === 'error' && <X className="h-4 w-4 text-red-700" />}
                    <span className="text-sm font-semibold text-gray-900">
                      {downloadStatus === 'preparing' && 'Preparing file for download...'}
                      {downloadStatus === 'ready' && 'File ready for download'}
                      {downloadStatus === 'downloading' && 'Downloading to your device...'}
                      {downloadStatus === 'completed' && 'Download completed!'}
                      {downloadStatus === 'error' && 'Download failed'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-700 font-bold bg-gray-200/50 px-2 py-1 rounded-full">{downloadProgress}%</span>
                </div>
                
                <Progress value={downloadProgress} className="h-2 bg-gray-200/30 rounded-full overflow-hidden" />
              </div>
            )}

            {/* Success Message */}
            {!isUploading && downloadStatus === 'completed' && (
              <div className="backdrop-blur-[12px] bg-green-500/15 border-2 border-green-400/50 rounded-xl p-4 shadow-lg shadow-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                  <span className="text-sm font-semibold text-green-900">
                    Recording saved to cloud and downloaded locally!
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleDownloadModalClose}
              disabled={isDownloading}
              className="backdrop-blur-[8px] bg-white/30 border-2 border-white/50 text-black font-semibold hover:bg-white/40 hover:border-white/60 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              {isUploading ? 'Continue in Background' : 'Close'}
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={isDownloading || !recordingBlob || downloadStatus === 'completed'}
              className="bg-blue-600/90 text-white font-semibold hover:bg-blue-700/90 backdrop-blur-sm border border-blue-400/30 shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              {downloadStatus === 'completed' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Downloaded
                </>
              ) : isDownloading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {downloadStatus === 'preparing' ? 'Preparing...' : 'Downloading...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Recording
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT SIDE: Meeting Setup & Recording Mode */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Meeting Bot Integration */}
          <Card className="glass-card border-black/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Meeting Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Meeting URL Input */}
              <div>
                <Label htmlFor="meetingUrl">Meeting URL</Label>
                <div className="relative">
                  <Input
                    id="meetingUrl"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://zoom.us/j/123456789 or meet.google.com/abc-def-ghi"
                    className="glass-card border-black/20 text-black pr-10"
                    disabled={!user}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {meetingPlatform !== 'unknown' && (
                      <span className="text-lg">{getPlatformIcon(meetingPlatform)}</span>
                    )}
                  </div>
                </div>
                {meetingUrl && (
                  <p className="text-xs text-black/60 mt-1">
                    {meetingPlatform !== 'unknown' 
                      ? `Detected: ${meetingInfo?.platform}` 
                      : 'Enter a Zoom, Google Meet, or Teams URL'}
                  </p>
                )}
              </div>

              {/* Meeting Info Display */}
              {meetingInfo && (
                <div className="glass-card p-3 border border-black/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-black/60" />
                    <span className="font-medium text-black">{meetingInfo.platform}</span>
                  </div>
                  {meetingInfo.meetingId && (
                    <p className="text-sm text-black/70">ID: {meetingInfo.meetingId}</p>
                  )}
                  {meetingInfo.roomCode && (
                    <p className="text-sm text-black/70">Room: {meetingInfo.roomCode}</p>
                  )}
                </div>
              )}

              {/* Bot Action Button */}
              <Button
                onClick={joinMeetingAndRecord}
                disabled={!user || !meetingUrl || botStatus === 'joining' || isRecording}
                className="w-full bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 transition-all h-12 disabled:opacity-50"
              >
                <Bot className="mr-2 h-5 w-5" />
                {!user ? 'Sign In Required' :
                 botStatus === 'joining' ? 'Joining Meeting...' : 
                 botStatus === 'connected' ? 'Start Recording' :
                 botStatus === 'recording' ? 'Bot Recording...' :
                 'Join Meeting & Record'}
              </Button>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-black/60">Or record locally</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recording Mode Selection */}
          <Card className="glass-card border-black/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Recording Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => setRecordingMode('audio')}
                  disabled={!user}
                  className={`glass-button text-black border-black/20 hover:scale-105 transition-all p-3 disabled:opacity-50 ${
                    recordingMode === 'audio' ? 'bg-black text-white' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Mic className="h-5 w-5" />
                    <span className="text-xs">Audio</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setRecordingMode('video')}
                  disabled={!user}
                  className={`glass-button text-black border-black/20 hover:scale-105 transition-all p-3 disabled:opacity-50 ${
                    recordingMode === 'video' ? 'bg-black text-white' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Video className="h-5 w-5" />
                    <span className="text-xs">Video</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setRecordingMode('screen')}
                  disabled={!user}
                  className={`glass-button text-black border-black/20 hover:scale-105 transition-all p-3 disabled:opacity-50 ${
                    recordingMode === 'screen' ? 'bg-black text-white' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Monitor className="h-5 w-5" />
                    <span className="text-xs">Screen</span>
                  </div>
                </Button>
              </div>
              
              {/* Audio/Video Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span className="text-sm font-medium">Audio</span>
                  </div>
                  <Switch
                    checked={isAudioEnabled}
                    onCheckedChange={setIsAudioEnabled}
                    disabled={!user}
                    className="switch-toggle"
                  />
                </div>
                
                {recordingMode !== 'audio' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {recordingMode === 'screen' ? 'Webcam Overlay' : 'Video'}
                      </span>
                    </div>
                    <Switch
                      checked={isVideoEnabled}
                      onCheckedChange={setIsVideoEnabled}
                      disabled={!user}
                      className="switch-toggle"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meeting Setup */}
          <Card className="glass-card border-black/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g., Weekly Team Standup"
                  className="glass-card border-black/20 text-black"
                  disabled={!user}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={meetingDescription}
                  onChange={(e) => setMeetingDescription(e.target.value)}
                  placeholder="Meeting agenda or notes..."
                  className="glass-card border-black/20 text-black"
                  rows={3}
                  disabled={!user}
                />
              </div>
              
              {/* Participants */}
              <div>
                <Label>Participants</Label>
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={participant}
                        onChange={(e) => updateParticipant(index, e.target.value)}
                        placeholder="Name or email"
                        className="glass-card border-black/20 text-black"
                        disabled={!user}
                      />
                      {participants.length > 1 && (
                        <Button
                          onClick={() => removeParticipant(index)}
                          disabled={!user}
                          className="glass-button text-black border-black/20 h-10 w-10 p-0 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addParticipant}
                    disabled={!user}
                    className="glass-button text-black border-black/20 w-full disabled:opacity-50"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Add Participant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card className="glass-card border-black/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Task Extraction</Label>
                  <p className="text-xs text-black/60">Auto-detect action items</p>
                </div>
                <Switch
                  checked={aiTaskExtraction}
                  onCheckedChange={setAiTaskExtraction}
                  disabled={!user}
                  className="switch-toggle"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Speaker ID</Label>
                  <p className="text-xs text-black/60">Identify who's speaking</p>
                </div>
                <Switch
                  checked={speakerIdentification}
                  onCheckedChange={setSpeakerIdentification}
                  disabled={!user}
                  className="switch-toggle"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto Summary</Label>
                  <p className="text-xs text-black/60">Generate meeting summary</p>
                </div>
                <Switch
                  checked={autoSummary}
                  onCheckedChange={setAutoSummary}
                  disabled={!user}
                  className="switch-toggle"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: Video Preview & Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video Preview (Local Recording Only) */}
          {recordingMode !== 'meeting-bot' && (recordingMode === 'video' || recordingMode === 'screen') && (
            <Card className="glass-card border-black/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {recordingMode === 'screen' ? 'Screen Preview' : 'Video Preview'}
                  {recordingMode === 'screen' && isVideoEnabled && (
                    <Badge className="bg-blue-500/20 text-blue-700 text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Webcam Overlay
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    className="w-full h-64 bg-black/5 rounded-lg object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        REC
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recording Controls */}
          <Card className="glass-card border-black/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {recordingMode === 'meeting-bot' ? <Bot className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {recordingMode === 'meeting-bot' ? 'Meeting Bot Controls' : 'Recording Controls'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Audio Level (if audio enabled) */}
              {isAudioEnabled && isRecording && streamRef.current?.getAudioTracks().length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Audio Level</Label>
                    <span className="text-xs text-black/60">{Math.round(audioLevel)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-black/60" />
                    <div className="flex-1 h-3 bg-black/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-75"
                        style={{ width: `${Math.min(audioLevel, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Saving to Cloud</Label>
                    <span className="text-xs text-black/60">{uploadProgress}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <div className="flex-1 h-3 bg-black/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Main Controls */}
              <div className="grid grid-cols-3 gap-4">
                {!isRecording ? (
                  <Button
                    onClick={recordingMode === 'meeting-bot' ? joinMeetingAndRecord : startRecording}
                    disabled={!user || (recordingMode === 'meeting-bot' && !meetingUrl)}
                    className="col-span-3 bg-red-500 text-white hover:bg-red-600 hover:scale-105 transition-all h-12 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      {recordingMode === 'meeting-bot' ? <Bot className="h-5 w-5" /> : 
                       recordingMode === 'audio' ? <Mic className="h-5 w-5" /> :
                       recordingMode === 'video' ? <Video className="h-5 w-5" /> :
                       <Monitor className="h-5 w-5" />}
                      {!user ? 'Sign In to Record' :
                       recordingMode === 'meeting-bot' ? 'Join & Record Meeting' : 
                       `Start ${recordingMode.charAt(0).toUpperCase() + recordingMode.slice(1)} Recording`}
                    </div>
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={togglePause}
                      disabled={isUploading}
                      className="glass-button text-black border-black/20 hover:bg-gray-800 hover:scale-105 transition-all h-12 disabled:opacity-50"
                    >
                      {isPaused ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={stopRecording}
                      disabled={isUploading}
                      className="col-span-2 glass-button bg-black text-black hover:bg-gray-800 hover:scale-105 transition-all h-12 disabled:opacity-50"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      {isUploading ? 'Saving...' : 
                       recordingMode === 'meeting-bot' ? 'Leave & Stop' : 'Stop & Save to Cloud'}
                    </Button>
                  </>
                )}
              </div>
              
              {/* Bot Status Info */}
              {recordingMode === 'meeting-bot' && botStatus !== 'idle' && (
                <div className="glass-card p-3 border border-black/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Bot Status</span>
                    </div>
                    <Badge className={getBotStatusColor(botStatus)}>
                      {botStatus.charAt(0).toUpperCase() + botStatus.slice(1)}
                    </Badge>
                  </div>
                  {meetingInfo && (
                    <p className="text-xs text-black/60 mt-1">
                      Connected to {meetingInfo.platform}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Transcription */}
          <Card className="glass-card border-black/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Live Transcription
                {isTranscribing && (
                  <Badge className="bg-green-500/20 text-green-700 animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Live
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] max-h-[300px] overflow-y-auto glass-card p-4 border border-black/10">
                {liveTranscript ? (
                  <p className="text-black leading-relaxed whitespace-pre-wrap">
                    {liveTranscript}
                    {isTranscribing && (
                      <span className="inline-block w-2 h-5 bg-black/60 ml-1 animate-pulse"></span>
                    )}
                  </p>
                ) : (
                  <div className="text-center text-black/50 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div className="space-y-2">
                      <p className="font-medium">Ready for AI transcription</p>
                      <p className="text-sm">
                        {recordingMode === 'meeting-bot' ? 'Meeting bot will capture and transcribe audio' : 
                         recordingMode === 'video' ? 'Video and audio will be processed with AI' : 
                         recordingMode === 'screen' ? 'Screen and audio will be processed with AI' : 'Audio will be processed with AI'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* API Integration Notice */}
              <div className="mt-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">AI Processing Ready</p>
                    <p className="text-blue-700">
                      Recordings will be saved to Supabase Storage and linked to your meeting records.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recorded Video Playback (hidden by default) */}
          <video
            ref={recordedVideoRef}
            controls
            className="w-full rounded-lg glass-card border border-black/10 hidden"
            style={{ display: 'none' }}
          />

          {/* AI Extracted Tasks */}
          {extractedTasks.length > 0 && (
            <Card className="glass-card border-black/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Extracted Tasks
                  <Badge className="bg-blue-500/20 text-blue-700">
                    {extractedTasks.length} detected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {extractedTasks.map((task) => (
                    <div key={task.id} className="glass-card p-4 border border-black/10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-black font-medium">{task.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {task.assignee}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {task.dueDate}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                        <Button className="glass-button text-black border-black/20 h-8 w-8 p-0">
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
