'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { 
  Crown, 
  Zap, 
  ArrowRight,
  Lock,
  TrendingUp
} from 'lucide-react'

interface UpgradePromptProps {
  title: string
  description: string
  reason?: string
  ctaText?: string
  onUpgrade?: () => void
  variant?: 'blocking' | 'warning' | 'feature'
  className?: string
}

export default function UpgradePrompt({
  title,
  description,
  reason,
  ctaText = 'Upgrade to Pro',
  onUpgrade,
  variant = 'blocking',
  className = ''
}: UpgradePromptProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      window.location.href = '/pricing'
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'blocking':
        return {
          card: 'border-red-200 bg-red-50',
          icon: 'bg-red-100 text-red-600',
          title: 'text-red-900',
          description: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700'
        }
      case 'warning':
        return {
          card: 'border-orange-200 bg-orange-50',
          icon: 'bg-orange-100 text-orange-600',
          title: 'text-orange-900',
          description: 'text-orange-700',
          button: 'bg-orange-600 hover:bg-orange-700'
        }
      case 'feature':
        return {
          card: 'border-primary-200 bg-primary-50',
          icon: 'bg-primary-100 text-primary-600',
          title: 'text-primary-900',
          description: 'text-primary-700',
          button: 'bg-primary-600 hover:bg-primary-700'
        }
      default:
        return {
          card: 'border-gray-200 bg-gray-50',
          icon: 'bg-gray-100 text-gray-600',
          title: 'text-gray-900',
          description: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }

  const styles = getVariantStyles()
  const Icon = variant === 'blocking' ? Lock : variant === 'warning' ? TrendingUp : Crown

  return (
    <Card className={`${styles.card} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${styles.icon} flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${styles.title}`}>
              {title}
            </h3>
            
            <p className={`mb-4 ${styles.description}`}>
              {description}
            </p>
            
            {reason && (
              <p className={`text-sm mb-4 ${styles.description} font-medium`}>
                {reason}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleUpgrade}
                className={`${styles.button} text-white`}
              >
                <Crown className="h-4 w-4 mr-2" />
                {ctaText}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/pricing'}
                className="border-current"
              >
                View All Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
