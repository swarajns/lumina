// Centralized pricing configuration
export const PRICING = {
  PLANS: {
    FREE: {
      name: 'Free',
      monthly: 0,
      yearly: 0,
    },
    PRO: {
      name: 'Pro', 
      monthly: 799,
      yearly: 599,
    },
    BUSINESS: {
      name: 'Business',
      monthly: 1999,
      yearly: 1499,
    },
    ENTERPRISE: {
      name: 'Enterprise',
      monthly: 2899,
      yearly: 2649,
    }
  },
  
  // ✅ Billing configuration for Business plan
  BILLING: {
    basePlanPrice: 1999,
    includedUsers: 2,
    additionalUserPrice: 617,
    planName: 'Business',
    currency: 'INR',
    billingCycle: 'monthly'
  },
  
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
  
  // Helper functions
  formatPrice: (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  },
  
  calculateSavings: (monthly: number, yearly: number) => {
    const yearlyTotal = yearly * 12
    const monthlyTotal = monthly * 12
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100)
  }
} as const

// ✅ Export the calculateTotalCost function
export const calculateTotalCost = (activeUsers: number) => {
  const additionalUsers = Math.max(0, activeUsers - PRICING.BILLING.includedUsers)
  const additionalCost = additionalUsers * PRICING.BILLING.additionalUserPrice
  return PRICING.BILLING.basePlanPrice + additionalCost
}

// ✅ Export formatPrice function
export const formatPrice = (price: number) => {
  return PRICING.formatPrice(price)
}
