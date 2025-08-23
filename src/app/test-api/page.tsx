'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { testGeminiConnection } from '@/lib/gemini'

export default function TestAPIPage() {
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [apiError, setApiError] = useState<string | null>(null)

  const testAPI = async () => {
    setIsTestingAPI(true)
    setApiError(null)
    
    try {
      const isWorking = await testGeminiConnection()
      setApiStatus(isWorking ? 'success' : 'error')
      if (!isWorking) {
        setApiError('API connection failed')
      }
    } catch (error: any) {
      setApiStatus('error')
      setApiError(error.message)
    } finally {
      setIsTestingAPI(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>🔧 API Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Test your Gemini API connection before recording
            </p>
            
            <Button 
              onClick={testAPI}
              disabled={isTestingAPI}
              className="w-full"
            >
              {isTestingAPI ? 'Testing...' : 'Test Gemini API'}
            </Button>
            
            {apiStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">✅ API connection successful!</p>
              </div>
            )}
            
            {apiStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">❌ API connection failed</p>
                {apiError && (
                  <p className="text-red-700 text-sm mt-1">{apiError}</p>
                )}
                <p className="text-red-700 text-sm mt-2">
                  Check your .env.local file and make sure NEXT_PUBLIC_GEMINI_API_KEY is set correctly.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
