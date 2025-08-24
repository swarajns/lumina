'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Check, Clock, AlertCircle, Copy, Download } from 'lucide-react'
import type { AIAnalysis, ActionItem } from '@/types'

interface AIResultsProps {
  analysis: AIAnalysis | null
  isLoading: boolean
  onActionItemToggle?: (id: string) => void
}

export default function AIResults({ analysis, isLoading, onActionItemToggle }: AIResultsProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadTranscript = () => {
    if (!analysis?.transcript) return
    
    const element = document.createElement('a')
    const file = new Blob([analysis.transcript], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-gray-600">Processing with AI...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>AI analysis will appear here after recording</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>AI Summary</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(analysis.summary, 'summary')}
          >
            <Copy className="h-4 w-4" />
            {copiedText === 'summary' ? 'Copied!' : 'Copy'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {analysis.summary}
            </p>
          </div>
          
          {/* Key Points */}
          {analysis.keyPoints && analysis.keyPoints.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Key Points:</h4>
              <ul className="space-y-1">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>To-Do List ({analysis.actionItems.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.actionItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Check className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No action items identified</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analysis.actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border-l-4 rounded-r-lg transition-all ${getPriorityColor(item.priority)} ${
                    item.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => onActionItemToggle?.(item.id)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        item.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {item.completed && <Check className="h-3 w-3" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.text}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        {getPriorityIcon(item.priority)}
                        <span className="text-xs text-gray-500 capitalize">
                          {item.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Full Transcript</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(analysis.transcript, 'transcript')}
            >
              <Copy className="h-4 w-4" />
              {copiedText === 'transcript' ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTranscript}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {analysis.transcript}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
