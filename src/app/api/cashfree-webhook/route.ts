import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Define TypeScript interfaces
interface CustomerDetails {
  id?: string
  customer_id?: string
}

interface OrderTags {
  planName?: string
  billing?: string
}

interface Order {
  plan_name?: string
  billing_cycle?: string
  order_tags?: OrderTags
  id?: string
  order_id?: string
}

interface Payment {
  payment_amount?: number
}

interface WebhookData {
  customer_details?: CustomerDetails
  order?: Order
  payment?: Payment
}

interface WebhookPayload {
  type: string
  data: WebhookData
}

interface SubscriptionRecord {
  id: string
  user_id: string
  plan_name: string
  billing_cycle: string
  status: string
  activated_at: string
  expires_at: string
  amount_paid: number
  cashfree_order_id: string
  created_at: string
  updated_at: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY!)
      .update(dataToVerify)
      .digest('base64')

    if (expectedSignature !== signature) {
      console.log('Signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Signature verified')

    const jsonData: WebhookPayload = JSON.parse(body)

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

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ message: 'Webhook endpoint is alive' })
}

async function processPaymentSuccess(data: WebhookData): Promise<void> {
  try {
    const userId = data.customer_details?.id || data.customer_details?.customer_id
    const planName = data.order?.plan_name || data.order?.order_tags?.planName || 'Unknown'
    const billing = data.order?.billing_cycle || data.order?.order_tags?.billing || 'monthly'
    const amountPaid = data.payment?.payment_amount || 0
    const activatedAt = new Date()
    const expiresAt = billing === 'yearly' 
        ? new Date(activatedAt.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(activatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const orderId = data.order?.id || data.order?.order_id

    if (!userId) {
      console.error('User ID missing in webhook data, cannot update subscription')
      return
    }

    console.log('Activating subscription for user:', userId, planName)

    const subscriptionRecord: Omit<SubscriptionRecord, 'id'> & { id?: string } = {
      id: crypto.randomUUID(),
      user_id: userId,
      plan_name: planName,
      billing_cycle: billing,
      status: 'active',
      activated_at: activatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_paid: amountPaid,
      cashfree_order_id: orderId || '',
      created_at: activatedAt.toISOString(),
      updated_at: activatedAt.toISOString(),
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionRecord, { onConflict: 'cashfree_order_id' })

    if (error) {
      console.error('Failed to update subscription:', error)
    } else {
      console.log('Subscription updated successfully')
    }
  } catch (err) {
    console.error('Error processing payment success:', err)
  }
}

async function processPaymentFailed(data: WebhookData): Promise<void> {
  console.log('Payment failed:', data)
  // Optionally handle failed payment logic here
  
  try {
    const userId = data.customer_details?.id || data.customer_details?.customer_id
    const orderId = data.order?.id || data.order?.order_id

    if (userId && orderId) {
      // Update subscription status to failed or handle accordingly
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('cashfree_order_id', orderId)

      if (error) {
        console.error('Failed to update failed payment status:', error)
      } else {
        console.log('Payment failure status updated successfully')
      }
    }
  } catch (err) {
    console.error('Error processing payment failure:', err)
  }
}
