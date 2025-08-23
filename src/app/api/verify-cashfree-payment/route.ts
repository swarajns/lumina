import { NextRequest, NextResponse } from 'next/server'
import { Cashfree } from 'cashfree-pg'

export async function POST(request: NextRequest) {
  try {
    // Initialize Cashfree for v5.x
    const cashfree = new Cashfree(
      Cashfree.SANDBOX, // or Cashfree.PRODUCTION
      process.env.NEXT_PUBLIC_CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!
    )

    const { orderId } = await request.json()
    console.log('🔍 Verifying payment for order:', orderId)

    // For v5.x, use PGOrderFetchPayments (this is correct for v5)
    const response = await Cashfree.PGOrderFetchPayments(orderId)
    
    console.log('Payment details response:', response)

    if (response.data && response.data.length > 0) {
      const payment = response.data[0]
      
      if (payment.payment_status === 'SUCCESS') {
        console.log('✅ Payment verification successful')
        
        return NextResponse.json({
          success: true,
          paymentStatus: payment.payment_status,
          paymentMethod: payment.payment_method,
          transactionId: payment.cf_payment_id,
          amount: payment.payment_amount
        })
      } else {
        console.log('❌ Payment not successful:', payment.payment_status)
        
        return NextResponse.json({
          success: false,
          paymentStatus: payment.payment_status,
          message: `Payment status: ${payment.payment_status}`
        })
      }
    } else {
      console.log('❌ No payment found or API error:', response)
      
      return NextResponse.json({
        success: false,
        message: 'No payment found for this order'
      })
    }
  } catch (error: any) {
    console.error('💥 Payment verification error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Verification failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
