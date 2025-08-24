'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Star, Crown, Building, Zap } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const orderId = searchParams.get('order_id')
  const planName = searchParams.get('plan')
  const amount = searchParams.get('amount')
  const billing = searchParams.get('billing')
  
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Separate useEffect for redirect when countdown reaches 0
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/dashboard')
    }
  }, [countdown, router])

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'Pro': return Star
      case 'Business': return Crown
      case 'Enterprise': return Building
      default: return Zap
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Pro': return 'text-blue-600 bg-blue-100'
      case 'Business': return 'text-purple-600 bg-purple-100'
      case 'Enterprise': return 'text-emerald-600 bg-emerald-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatAmount = (amt: string | null) => {
    if (!amt) return '₹0'
    const num = parseInt(amt)
    return `₹${num.toLocaleString()}`
  }

  const Icon = getPlanIcon(planName || 'Free')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <Card className="max-w-lg w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful! 🎉
            </h1>
            <p className="text-gray-600">
              Welcome to your upgraded plan! You now have access to all premium features.
            </p>
          </div>
          
          {/* Plan Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className={`p-3 rounded-full ${getPlanColor(planName || 'Free')}`}>
                <Icon className="h-8 w-8" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {planName || 'Pro'} Plan Activated
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium text-gray-900">{planName || 'Pro'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium text-gray-900">{formatAmount(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing:</span>
                <span className="font-medium text-gray-900 capitalize">{billing || 'yearly'}</span>
              </div>
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-mono text-xs text-gray-500">{orderId}</span>
              </div>
            </div>
          </div>

          {/* Features Unlocked */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-2">Features Unlocked:</h4>
            <div className="text-sm text-green-700 space-y-1">
              {planName === 'Pro' && (
                <>
                  <p>✅ 50 meetings per month</p>
                  <p>✅ AI summaries & action items</p>
                  <p>✅ Advanced search & filters</p>
                  <p>✅ PDF/Word export</p>
                  <p>✅ Meeting notes & annotations</p>
                </>
              )}
              {planName === 'Business' && (
                <>
                  <p>✅ Unlimited meetings</p>
                  <p>✅ Team collaboration (up to 10 users)</p>
                  <p>✅ Analytics dashboard</p>
                  <p>✅ Custom branding</p>
                  <p>✅ API access</p>
                </>
              )}
              {planName === 'Enterprise' && (
                <>
                  <p>✅ Unlimited users</p>
                  <p>✅ White-label solution</p>
                  <p>✅ Custom integrations</p>
                  <p>✅ Dedicated account manager</p>
                  <p>✅ On-premise deployment</p>
                </>
              )}
            </div>
          </div>

          {/* Auto-redirect countdown */}
          {countdown > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in {countdown} seconds...
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              onClick={() => router.push('/record')} 
              variant="outline"
              className="w-full"
            >
              Start Recording Meeting
            </Button>
          </div>

          {/* Support */}
          <div className="mt-6 text-xs text-gray-500">
            <p>Need help? Contact us at support@lumina.ai</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
