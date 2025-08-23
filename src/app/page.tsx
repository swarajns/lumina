'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Mic, Upload, History, Zap, Shield, Clock } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Get instant transcripts, summaries, and action items powered by Google Gemini'
    },
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'Your meetings are securely stored in the cloud with end-to-end protection'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Never miss important details with automated meeting analysis and tracking'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Meeting
            <span className="text-primary-600"> Recording</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Record, transcribe, and analyze your meetings with advanced AI. 
            Get instant summaries, action items, and searchable transcripts.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => router.push('/record')}
              className="flex items-center gap-2"
            >
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/upload')}
              className="flex items-center gap-2"
            >
              <Upload className="h-5 w-5" />
              Upload File
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => router.push('/meetings')}
              className="flex items-center gap-2"
            >
              <History className="h-5 w-5" />
              View Meetings
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Getting Started */}
        <Card className="bg-gradient-to-r from-primary-50 to-blue-50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-6">
              Choose how you'd like to begin your meeting analysis journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push('/record')}>
                <Mic className="h-4 w-4 mr-2" />
                Record New Meeting
              </Button>
              <Button variant="outline" onClick={() => router.push('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Existing File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
