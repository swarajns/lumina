'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import UpgradePrompt from '@/components/UpgradePrompt'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import AIResults from '@/components/AIResults'
import { Upload, FileAudio, FileVideo, X, Check, Edit3, Crown, Zap, Clock, Users } from 'lucide-react'
import { analyzeAudio } from '@/lib/gemini'
import { formatFileSize } from '@/lib/utils'
import type { AIAnalysis } from '@/types'

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
}

export default function UploadPage() {
  const router = useRouter()
  const { limits, loading } = useSubscriptionLimits()
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Check limits before processing
    if (!limits.canUpload) {
      return // Let the UI show the upgrade prompt
    }

    const file = files[0]
    
    // Check file type
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert('Please select an audio or video file')
      return
    }

    // Auto-generate meeting title from filename if empty
    if (!meetingTitle.trim()) {
      const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      const cleanName = fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      setMeetingTitle(cleanName)
    }

    // Create uploaded file object
    const uploadedFile: UploadedFile = {
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'uploading'
    }

    setUploadedFile(uploadedFile)
    setAnalysis(null)

    // Simulate upload progress
    let progress = 0
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(uploadInterval)
        setUploadedFile(prev => prev ? { ...prev, progress, status: 'completed' } : null)
        
        // Start AI analysis
        analyzeFile(file)
      } else {
        setUploadedFile(prev => prev ? { ...prev, progress } : null)
      }
    }, 200)
  }, [meetingTitle, limits.canUpload])

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true)
    
    try {
      // Create FormData to send to our API
      const formData = new FormData()
      formData.append('audio', file, file.name)
      formData.append('title', meetingTitle.trim() || file.name.replace(/\.[^/.]+$/, ''))
      formData.append('duration', '0') // We don't know duration for uploaded files
      formData.append('source', 'upload') // Tag as uploaded file

      // Send to our API route
      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const aiAnalysis = await response.json()
      setAnalysis(aiAnalysis)
    } catch (error) {
      console.error('Failed to analyze file:', error)
      setAnalysis({
        transcript: 'Error: Failed to analyze uploaded file. Please try again.',
        summary: 'File upload completed but analysis failed.',
        actionItems: [{
          id: `error-${Date.now()}`,
          text: 'Retry file analysis',
          completed: false,
          priority: 'high' as const
        }],
        keyPoints: [
          'File uploaded successfully',
          'Analysis failed',
          'Try again or check file format'
        ]
      })
      setUploadedFile(prev => prev ? { ...prev, status: 'error' } : null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleActionItemToggle = (id: string) => {
    if (!analysis) return
    
    setAnalysis(prev => {
      if (!prev) return prev
      
      return {
        ...prev,
        actionItems: prev.actionItems.map(item =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      }
    })
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const removeFile = () => {
    setUploadedFile(null)
    setAnalysis(null)
  }

  const getFileIcon = (fileType: string) => {
    return fileType.startsWith('video/') ? FileVideo : FileAudio
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show upgrade prompt if at limit
  if (!limits.canUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Upload Limit Reached
            </h1>
            <p className="text-gray-600">
              You've used all your meetings for this month. Upgrade to continue uploading.
            </p>
          </div>

          <UpgradePrompt
            title="Upgrade to Continue Uploading"
            description="Get unlimited uploads, AI analysis, and export features with our Pro plan."
            reason={limits.upgradeReason || undefined}
            ctaText="Upgrade to Pro"
            variant="blocking"
            className="max-w-2xl mx-auto"
          />

          {/* Pro features preview */}
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
                <span className="text-blue-900">Unlimited file size</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Usage Indicator */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Recording
          </h1>
          <p className="text-gray-600">
            Upload your audio or video files to get AI-powered analysis
          </p>
          
          {/* Usage indicator */}
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
              description="You're running low on meetings this month. Upgrade to Pro for unlimited uploads."
              reason={limits.upgradeReason || undefined}
              variant="warning"
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            {/* Meeting Title Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Meeting Details
                </CardTitle>
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
                      placeholder="Enter meeting title... (will auto-fill from filename)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={uploadedFile?.status === 'uploading' || isAnalyzing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {meetingTitle.trim() 
                        ? `Will be saved as: "${meetingTitle.trim()}"` 
                        : 'Will auto-generate from filename if left empty'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Select File</CardTitle>
              </CardHeader>
              <CardContent>
                {!uploadedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Drop your file here
                    </h3>
                    <p className="text-gray-600 mb-4">
                      or click to browse
                    </p>
                    <Button
                      onClick={() => document.getElementById('file-input')?.click()}
                      disabled={!limits.canUpload}
                    >
                      Select File
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      accept="audio/*,video/*"
                      onChange={(e) => handleFiles(e.target.files)}
                      className="hidden"
                      disabled={!limits.canUpload}
                    />
                    <p className="text-xs text-gray-500 mt-4">
                      Supported formats: MP3, WAV, MP4, MOV, WebM
                      {limits.planName === 'Free' && (
                        <span className="block text-orange-600 font-medium mt-1">
                          Free plan: Max file duration analyzed
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Info */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {uploadedFile.file.type.startsWith('video/') ? (
                          <FileVideo className="h-8 w-8 text-gray-600" />
                        ) : (
                          <FileAudio className="h-8 w-8 text-gray-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                          {meetingTitle.trim() && (
                            <p className="text-sm text-primary-600 font-medium">
                              Meeting: "{meetingTitle.trim()}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getStatusColor(uploadedFile.status)}`}>
                          {uploadedFile.status === 'uploading' && 'Uploading...'}
                          {uploadedFile.status === 'completed' && 'Completed'}
                          {uploadedFile.status === 'error' && 'Error'}
                        </span>
                        
                        {uploadedFile.status === 'completed' && (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {uploadedFile.status === 'uploading' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Uploading...</span>
                          <span>{Math.round(uploadedFile.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload Another File */}
                    {uploadedFile.status === 'completed' && !isAnalyzing && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadedFile(null)
                          setMeetingTitle('')
                        }}
                        className="w-full"
                        disabled={!limits.canUpload}
                      >
                        {limits.canUpload ? 'Upload Another File' : 'Upgrade for More Uploads'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Status */}
            {isAnalyzing && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <div>
                      <p className="font-medium text-gray-900">AI Processing</p>
                      <p className="text-sm text-gray-600">
                        Analyzing "{meetingTitle.trim() || 'your uploaded file'}" with Gemini AI...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - AI Results */}
          <div className="space-y-6">
            <div className="sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                AI Analysis
              </h2>
              <AIResults
                analysis={analysis}
                isLoading={isAnalyzing}
                onActionItemToggle={handleActionItemToggle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
