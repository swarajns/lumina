'use client'

import React, { useState, useEffect } from 'react'
import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Star, Zap, Crown, Building } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for trying out our platform',
    features: [
      '3 meetings per month',
      'Up to 30 minutes per meeting',
      'Basic transcription',
      'Simple search',
      'Web access',
      'Community support'
    ],
    limitations: [
      'No AI summaries',
      'No export options',
      'No advanced search',
      'No meeting notes'
    ],
    icon: Zap,
    color: 'gray',
    popular: false,
  },
  {
    name: 'Pro',
    price: { monthly: 799, yearly: 599 },
    description: 'Everything you need for productive meetings',
    features: [
      '50 meetings per month',
      'Unlimited recording time per meeting',
      'AI summaries & action items',
      'Advanced search & filters',
      'PDF/Word export',
      'Meeting notes & annotations',
      'Professional audio player',
      'Email support',
      'Mobile app access',
    ],
    icon: Star,
    color: 'blue',
    popular: true,
  },
  {
    name: 'Business',
    price: { monthly: 1999, yearly: 1499 },
    description: 'Advanced features for teams and professionals',
    features: [
      'Unlimited meetings',
      'Everything in Pro',
      'Team collaboration (up to 10 users)',
      'Analytics dashboard',
      'Custom branding',
      'API access',
      'Bulk export',
      'Advanced integrations',
      'Priority support',
      'Admin controls',
      '99.9% uptime SLA',
    ],
    icon: Crown,
    color: 'purple',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: { monthly: 2899, yearly: 2649 },
    description: 'Tailored solutions for large organizations',
    features: [
      'Unlimited meetings',
      'Everything in Business',
      'Unlimited users',
      'White-label solution',
      'Custom integrations',
      'Dedicated account manager',
      'On-premise deployment',
      'Advanced security & compliance',
      '24/7 phone support',
      'Custom contract terms',
      'Training & onboarding',
      'SSO & SAML integration',
      'Advanced analytics & reporting',
    ],
    icon: Building,
    color: 'emerald',
    popular: false,
    isEnterprise: true,
  },
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (session?.user) {
        setUser(session.user)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const getButtonText = (plan: any) => {
    if (plan.name === 'Free') return 'Get Started Free'
    if (plan.isEnterprise) return 'Contact Sales'
    return 'Start Free Trial'
  }

  const getButtonAction = (plan: any) => {
    if (plan.name === 'Free') {
      return () => router.push('/record')
    }
    if (plan.isEnterprise) {
      return () => window.open('mailto:sales@lumina.ai?subject=Enterprise Plan Inquiry', '_blank')
    }

    return async () => {
      if (loading || !cashfreeLoaded || !user) return

      try {
        setLoading(plan.name)

        const amount = isYearly ? plan.price.yearly * 12 : plan.price.monthly

        const response = await fetch('/api/create-cashfree-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            planName: plan.name,
            billing: isYearly ? 'yearly' : 'monthly',
            customerDetails: {
              id: user.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email,
              phone: user.user_metadata?.phone || '9999999999',
            },
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create order')
        }

        const { orderId, paymentSessionId } = await response.json()

        const cashfree = new (window as any).Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox',
        })

        const checkoutOptions = {
          paymentSessionId,
          redirectTarget: '_modal',
          appearance: {
            primaryColor: '#3B82F6',
            backgroundColor: '#ffffff',
            errorColor: '#ff0000',
            theme: 'light',
          },
        }

        console.log('🚀 Opening Cashfree checkout...')
        
        const result = await cashfree.checkout(checkoutOptions)
        
        console.log('💳 Cashfree checkout result:', result)
        
        if (result.error) {
          console.error('❌ Payment error:', result.error)
          alert('Payment failed: ' + result.error.message)
        } else if (result.redirect) {
          console.log('✅ Payment completed, redirecting to success page...')
          window.location.href = `/payment-success?order_id=${orderId}&plan=${plan.name}&amount=${amount}&billing=${isYearly ? 'yearly' : 'monthly'}`
        } else {
          console.log('⏳ Payment processing...')
          setTimeout(() => {
            window.location.href = `/payment-success?order_id=${orderId}&plan=${plan.name}&amount=${amount}&billing=${isYearly ? 'yearly' : 'monthly'}`
          }, 3000)
        }
      } catch (error) {
        console.error('Payment initialization error:', error)
        alert('Payment failed. Please try again.')
      } finally {
        setLoading(null)
      }
    }
  }

  const formatPrice = (plan: any) => {
    if (plan.name === 'Free') {
      return (
        <div>
          <span className="text-4xl font-bold text-gray-900">₹0</span>
          <span className="text-gray-600">/forever</span>
        </div>
      )
    }

    const price = isYearly ? plan.price.yearly : plan.price.monthly
    const yearlyMonthlyPrice = plan.price.yearly
    const monthlySavings = (
      ((plan.price.monthly - plan.price.yearly) / plan.price.monthly) * 100
    ).toFixed(0)

    if (isYearly) {
      return (
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">₹{yearlyMonthlyPrice}</span>
            <span className="text-gray-600">/month</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            billed annually (₹{plan.price.yearly * 12}/year)
          </div>
          <div className="text-sm text-green-600 font-semibold mt-1">
            Save {monthlySavings}% vs monthly
          </div>
          {plan.isEnterprise && (
            <div className="text-xs text-gray-400 mt-1">
              ~${(plan.price.yearly / 83).toFixed(0)}/month USD
            </div>
          )}
        </div>
      )
    } else {
      return (
        <div>
          <span className="text-4xl font-bold text-gray-900">₹{price}</span>
          <span className="text-gray-600">/month</span>
          {plan.isEnterprise && (
            <div className="text-sm text-gray-500 mt-1">
              ~${(price / 83).toFixed(0)}/month USD
            </div>
          )}
        </div>
      )
    }
  }

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <div className="text-black font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Load Cashfree SDK */}
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onLoad={() => setCashfreeLoaded(true)}
        strategy="lazyOnload"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your meetings with AI-powered transcription, smart
              summaries, and powerful analytics. Start free, upgrade as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isYearly ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly
              </span>
              {isYearly && (
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                  Save up to 25%
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map((plan) => {
              const Icon = plan.icon
              const isLoadingThis = loading === plan.name

              return (
                <Card
                  key={plan.name}
                  className={`relative transition-all hover:shadow-xl ${
                    plan.popular
                      ? 'ring-2 ring-primary-600 scale-105 lg:scale-110'
                      : plan.isEnterprise
                      ? 'ring-2 ring-emerald-500'
                      : 'hover:scale-105'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-4 py-1 text-sm font-semibold rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {plan.isEnterprise && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-emerald-600 text-white px-4 py-1 text-sm font-semibold rounded-full">
                        Enterprise
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pb-6">
                    <div
                      className={`inline-flex p-3 rounded-full mb-4 ${
                        plan.color === 'blue'
                          ? 'bg-blue-100'
                          : plan.color === 'purple'
                          ? 'bg-purple-100'
                          : plan.color === 'emerald'
                          ? 'bg-emerald-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          plan.color === 'blue'
                            ? 'text-blue-600'
                            : plan.color === 'purple'
                            ? 'text-purple-600'
                            : plan.color === 'emerald'
                            ? 'text-emerald-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <p className="text-gray-600 mt-2 text-sm">{plan.description}</p>
                    <div className="mt-4">{formatPrice(plan)}</div>
                  </CardHeader>

                  <CardContent>
                    <Button
                      onClick={getButtonAction(plan)}
                      disabled={isLoadingThis || (plan.name !== 'Free' && !cashfreeLoaded)}
                      className={`w-full mb-6 ${
                        plan.popular
                          ? 'bg-primary-600 hover:bg-primary-700'
                          : plan.isEnterprise
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : ''
                      }`}
                      variant={plan.popular || plan.isEnterprise ? 'default' : 'outline'}
                    >
                      {isLoadingThis ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : !cashfreeLoaded && plan.name !== 'Free' ? (
                        'Loading Payment...'
                      ) : (
                        getButtonText(plan)
                      )}
                    </Button>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations?.map((limitation, index) => (
                        <li key={index} className="flex items-start gap-3 opacity-50">
                          <span className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-400">×</span>
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
