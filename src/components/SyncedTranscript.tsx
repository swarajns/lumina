'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Play, Pause } from 'lucide-react'

interface TranscriptSegment {
  text: string
  startTime: number
  endTime: number
}

interface SyncedTranscriptProps {
  transcript: string
  audioUrl: string
  className?: string
}

export default function SyncedTranscript({ 
  transcript, 
  audioUrl, 
  className = '' 
}: SyncedTranscriptProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse transcript into timed segments (for demo purposes)
  useEffect(() => {
    if (!transcript) return

    // Split transcript into sentences and estimate timing
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const estimatedSegments: TranscriptSegment[] = sentences.map((sentence, index) => {
      const wordsCount = sentence.trim().split(' ').length
      const duration = Math.max(2, wordsCount * 0.4) // ~0.4 seconds per word
      const startTime = index * 3 // 3 seconds between segments
      
      return {
        text: sentence.trim(),
        startTime,
        endTime: startTime + duration
      }
    })

    setSegments(estimatedSegments)
  }, [transcript])

  // Handle audio time updates
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Auto-scroll to current segment
  useEffect(() => {
    const activeIndex = segments.findIndex(segment => 
      currentTime >= segment.startTime && currentTime < segment.endTime
    )

    if (activeIndex >= 0 && containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [currentTime, segments])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSegmentClick = (startTime: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = startTime
    if (!isPlaying) {
      audio.play()
    }
  }

  return (
    <div className={`synced-transcript ${className}`}>
      {/* Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <Button
          onClick={handlePlayPause}
          className="flex items-center gap-2"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <div className="text-sm text-gray-600">
          {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
        </div>
      </div>

      {/* Synchronized Transcript */}
      <div 
        ref={containerRef}
        className="transcript-container max-h-96 overflow-y-auto p-4 bg-white border rounded-lg space-y-3"
      >
        {segments.length > 0 ? (
          segments.map((segment, index) => {
            const isActive = currentTime >= segment.startTime && currentTime < segment.endTime
            const isPast = currentTime > segment.endTime
            
            return (
              <div
                key={index}
                className={`transcript-segment p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary-100 text-primary-900 shadow-md transform scale-[1.02]' 
                    : isPast 
                    ? 'bg-gray-50 text-gray-600' 
                    : 'bg-white text-gray-800 hover:bg-gray-50'
                } border-l-4 ${
                  isActive 
                    ? 'border-primary-500' 
                    : isPast 
                    ? 'border-gray-300' 
                    : 'border-transparent'
                }`}
                onClick={() => handleSegmentClick(segment.startTime)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xs text-gray-500 mt-1 min-w-[50px]">
                    {Math.floor(segment.startTime / 60)}:{(segment.startTime % 60).toFixed(0).padStart(2, '0')}
                  </div>
                  <div className="flex-1 leading-relaxed">
                    {segment.text}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>Processing transcript...</p>
            <div className="mt-4 text-sm">
              {transcript.substring(0, 200)}...
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-100"
          style={{ 
            width: segments.length > 0 
              ? `${(currentTime / Math.max(...segments.map(s => s.endTime))) * 100}%` 
              : '0%'
          }}
        />
      </div>
    </div>
  )
}
