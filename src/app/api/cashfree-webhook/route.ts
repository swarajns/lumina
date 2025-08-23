import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Webhook received!')

    const signature = request.headers.get('x-webhook-signature')
    const timestamp = request.headers.get('x-webhook-timestamp')
    const body = await request.text()

    console.log('Headers:', { signature, timestamp })
    console.log('Body length:', body.length)

    if (!signature || !timestamp) {
      console.log('Missing webhook headers')
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
    }

    // Verify Signature
    const dataToVerify = timestamp + body
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHBASE_SECRET_KEY!)
      .update(dataToVerify)
      .digest('base64')

    if (expectedSignature !== signature) {
      console.log('Signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Signature verified')

    const jsonData = JSON.parse(body)

    if (jsonData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      console.log('Processing payment success webhook')
      await processPaymentSuccess(jsonData.data)
    } else if (jsonData.type === 'PAYMENT_FAILED_WEBHOOK') {
      console.log('Processing payment failed webhook')
      await processPaymentFailed(jsonData.data)
    } else {
      console.log('Ignoring webhook type:', jsonData.type)
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint is alive' })
}

async function processPaymentSuccess(data: any) {
  try {
    const userId = data.customer_details?.id || data.customer_details?.customer_id
    const planName = data.order?.plan_name || data.order?.order_tags?.planName || 'Unknown'
    const billing = data.order?.billing_cycle || data.order?.order_tags?.billing || 'monthly'
    const amountPaid = data.payment?.payment_amount || 0
    const activatedAt = new Date()
    const expiresAt = billing === 'yearly' 
        ? new Date(activatedAt.getTime() + 365*24*60*60*1000)
        : new Date(activatedAt.getTime() + 30*24*60*60*1000)
    const orderId = data.order?.id || data.order?.order_id

    if (!userId) {
      console.error('User ID missing in webhook data, cannot update subscription')
      return
    }

    console.log('Activating subscription for user:', userId, planName)

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        id: crypto.randomUUID(),  // or omit to auto-generate
        user_id: userId,
        plan_name: planName,
        billing_cycle: billing,
        status: 'active',
        activated_at: activatedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        amount_paid: amountPaid,
        cashfree_order_id: orderId,
        created_at: activatedAt.toISOString(),
        updated_at: activatedAt.toISOString(),
      },
      { onConflict: 'cashfree_order_id'})

    if (error) {
      console.error('Failed to update subscription:', error)
    } else {
      console.log('Subscription updated successfully')
    }
  } catch (err) {
    console.error('Error processing payment success:', err)
  }
}

async function processPaymentFailed(data: any) {
  console.log('Payment failed:', data)
  // Optionally handle failed payment logic here
}
