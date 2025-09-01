'use client'

import React, { useState, useEffect } from 'react'
import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Crown, Building, X, Sparkles, Users, Clock } from 'lucide-react'
import { PRICING } from '@/lib/pricing'

// ✅ Updated plans array using centralized pricing
const plans = [
  {
    name: PRICING.PLANS.FREE.name,
    price: { monthly: PRICING.PLANS.FREE.monthly, yearly: PRICING.PLANS.FREE.yearly },
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
      'No meeting notes',
      'No team collaboration'
    ],
    icon: Zap,
    color: 'gray',
    popular: false,
  },
  {
    name: PRICING.PLANS.PRO.name,
    price: { monthly: PRICING.PLANS.PRO.monthly, yearly: PRICING.PLANS.PRO.yearly },
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
      'Calendar integrations',
      'Custom tags & categories'
    ],
    icon: Star,
    color: 'blue',
    popular: true,
  },
  {
    name: PRICING.PLANS.BUSINESS.name,
    price: { monthly: PRICING.PLANS.BUSINESS.monthly, yearly: PRICING.PLANS.BUSINESS.yearly },
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
      'Meeting templates',
      'Advanced security features'
    ],
    icon: Crown,
    color: 'purple',
    popular: false,
  },
  {
    name: PRICING.PLANS.ENTERPRISE.name,
    price: { monthly: PRICING.PLANS.ENTERPRISE.monthly, yearly: PRICING.PLANS.ENTERPRISE.yearly },
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
      'Custom API endpoints',
      'HIPAA compliance'
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
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
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
    if (plan.name === PRICING.PLANS.FREE.name) return 'Get Started Free'
    if (plan.isEnterprise) return 'Contact Sales Team'
    return 'Start 7-Day Free Trial'
  }

  const getButtonAction = (plan: any) => {
    if (plan.name === PRICING.PLANS.FREE.name) {
      return () => router.push('/record')
    }
    if (plan.isEnterprise) {
      return () => window.open('mailto:sales@luminameeting.ai?subject=Enterprise Plan Inquiry&body=Hi! I\'m interested in learning more about your Enterprise plan. Please contact me to discuss our requirements.', '_blank')
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

        const result = await cashfree.checkout(checkoutOptions)
        
        if (result.error) {
          console.error('❌ Payment error:', result.error)
          alert('Payment failed: ' + result.error.message)
        } else if (result.redirect) {
          window.location.href = `/payment-success?order_id=${orderId}&plan=${plan.name}&amount=${amount}&billing=${isYearly ? 'yearly' : 'monthly'}`
        } else {
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

  // ✅ Updated formatPrice function using centralized pricing
  const formatPrice = (plan: any) => {
    if (plan.name === PRICING.PLANS.FREE.name) {
      return (
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-gray-900">{PRICING.formatPrice(0)}</span>
            <span className="text-gray-600">/forever</span>
          </div>
          <div className="text-sm text-green-600 font-semibold mt-1">
            No credit card required
          </div>
        </div>
      )
    }

    const price = isYearly ? plan.price.yearly : plan.price.monthly
    const savings = PRICING.calculateSavings(plan.price.monthly, plan.price.yearly)

    if (isYearly) {
      return (
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-gray-900">{PRICING.formatPrice(price)}</span>
            <span className="text-gray-600">/month</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {PRICING.formatPrice(plan.price.yearly * 12)}/year (billed annually)
          </div>
          <div className="inline-flex items-center mt-2">
            <Badge className="bg-green-100 text-green-800 text-xs font-semibold">
              Save {savings}% vs monthly
            </Badge>
          </div>
          {plan.isEnterprise && (
            <div className="text-xs text-gray-400 mt-1">
              ~${(price / 83).toFixed(0)}/month USD
            </div>
          )}
        </div>
      )
    } else {
      return (
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-gray-900">{PRICING.formatPrice(price)}</span>
            <span className="text-gray-600">/month</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            billed monthly
          </div>
          {plan.isEnterprise && (
            <div className="text-xs text-gray-400 mt-1">
              ~${(price / 83).toFixed(0)}/month USD
            </div>
          )}
        </div>
      )
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Pricing</h2>
          <p className="text-gray-600">Please wait while we set up your pricing options...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onLoad={() => setCashfreeLoaded(true)}
        onError={() => console.error('Failed to load Cashfree SDK')}
        strategy="lazyOnload"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Meeting Intelligence
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your meetings with AI-powered transcription, smart summaries, 
              and powerful analytics. Start free, upgrade as you grow.
            </p>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 mb-12 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                10,000+ users
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-green-600" />
                99.9% uptime
              </div>
              <div className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                SOC 2 compliant
              </div>
            </div>

            {/* Enhanced Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-lg font-medium transition-colors ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-lg ${
                  isYearly ? 'bg-blue-600 shadow-blue-600/30' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-lg font-medium transition-colors ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-sm font-semibold animate-pulse">
                  Save up to 25%
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
            {plans.map((plan) => {
              const Icon = plan.icon
              const isLoadingThis = loading === plan.name
              const isHovered = hoveredPlan === plan.name

              return (
                <Card
                  key={plan.name}
                  onMouseEnter={() => setHoveredPlan(plan.name)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  className={`relative transition-all duration-300 cursor-pointer ${
                    plan.popular
                      ? 'ring-2 ring-blue-500 scale-105 xl:scale-110 shadow-2xl shadow-blue-500/20'
                      : plan.isEnterprise
                      ? 'ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10'
                      : isHovered 
                      ? 'shadow-2xl scale-105 ring-2 ring-gray-200'
                      : 'shadow-lg hover:shadow-xl'
                  } ${plan.name === 'Free' ? 'bg-gradient-to-br from-gray-50 to-white' : 
                       plan.name === 'Pro' ? 'bg-gradient-to-br from-blue-50 to-white' :
                       plan.name === 'Business' ? 'bg-gradient-to-br from-purple-50 to-white' :
                       'bg-gradient-to-br from-emerald-50 to-white'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-bold shadow-lg">
                        🔥 Most Popular
                      </Badge>
                    </div>
                  )}

                  {plan.isEnterprise && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 text-sm font-bold shadow-lg">
                        🏢 Enterprise
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-6">
                    <div
                      className={`inline-flex p-4 rounded-full mb-4 transition-all duration-300 ${
                        plan.color === 'blue'
                          ? 'bg-blue-100'
                          : plan.color === 'purple'
                          ? 'bg-purple-100'
                          : plan.color === 'emerald'
                          ? 'bg-emerald-100'
                          : 'bg-gray-100'
                      } ${isHovered ? 'scale-110' : ''}`}
                    >
                      <Icon
                        className={`h-8 w-8 ${
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
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</CardTitle>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">{plan.description}</p>
                    <div className="mb-6">{formatPrice(plan)}</div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <Button
                      onClick={getButtonAction(plan)}
                      disabled={isLoadingThis || (plan.name !== PRICING.PLANS.FREE.name && !cashfreeLoaded)}
                      className={`w-full mb-8 py-3 font-semibold text-sm transition-all duration-300 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                          : plan.isEnterprise
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl'
                          : 'hover:scale-105'
                      }`}
                      variant={plan.popular || plan.isEnterprise ? 'default' : 'outline'}
                    >
                      {isLoadingThis ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing Payment...
                        </div>
                      ) : !cashfreeLoaded && plan.name !== PRICING.PLANS.FREE.name ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Loading Payment Gateway...
                        </div>
                      ) : (
                        getButtonText(plan)
                      )}
                    </Button>

                    {/* Features List */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 text-sm">What's included:</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                              <Check className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                          </li>
                        ))}
                        
                        {plan.limitations?.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-3 opacity-60">
                            <div className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                              <X className="h-3 w-3 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500 leading-relaxed">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* FAQ Section */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
              <div className="grid gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h3>
                  <p className="text-gray-600 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
                  <p className="text-gray-600 text-sm">Yes! All paid plans come with a 7-day free trial. No credit card required for the Free plan.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                  <p className="text-gray-600 text-sm">We accept all major credit cards, debit cards, UPI, net banking, and digital wallets through our secure payment partner Cashfree.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to transform your meetings?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who are already saving hours with AI-powered meeting intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/record')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 font-semibold"
              >
                Start Free Today
              </Button>
              <Button 
                onClick={() => window.open('mailto:sales@luminameeting.ai?subject=Demo Request', '_blank')}
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 font-semibold"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
