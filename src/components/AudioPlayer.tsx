'use client'

import React from 'react'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'

interface AudioPlayerProps {
  src: string
  title?: string
  onPlay?: () => void
  onPause?: () => void
  className?: string
}

const CustomAudioPlayer: React.FC<AudioPlayerProps> = ({ 
  src, 
  title, 
  onPlay, 
  onPause,
  className = ''
}) => {
  return (
    <div className={`audio-player-wrapper ${className}`}>
      {title && (
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        </div>
      )}
      <AudioPlayer
        src={src}
        onPlay={onPlay}
        onPause={onPause}
        showJumpControls={true}
        showSkipControls={false}
        showDownloadProgress={true}
        layout="stacked-reverse"
        customProgressBarSection={[
          'CURRENT_TIME',
          'PROGRESS_BAR',
          'DURATION',
        ]}
        customControlsSection={[
          'MAIN_CONTROLS',
          'VOLUME_CONTROLS'
        ]}
        autoPlayAfterSrcChange={false}
        className="rounded-lg"
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  )
}

export default CustomAudioPlayer
