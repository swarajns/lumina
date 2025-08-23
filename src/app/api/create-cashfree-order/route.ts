import { NextRequest, NextResponse } from 'next/server'
import { Cashfree } from 'cashfree-pg'

export async function POST(request: NextRequest) {
  console.log('🚀 DEBUG: API Route Hit - create-cashfree-order')
  
  try {
    // Log all environment variables
    console.log('🔧 DEBUG: Environment Variables Check:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- NEXT_PUBLIC_CASHFREE_APP_ID:', process.env.NEXT_PUBLIC_CASHFREE_APP_ID)
    console.log('- CASHFREE_SECRET_KEY exists:', !!process.env.CASHFREE_SECRET_KEY)
    console.log('- CASHFREE_SECRET_KEY length:', process.env.CASHFREE_SECRET_KEY?.length)
    console.log('- NEXT_PUBLIC_CASHFREE_ENVIRONMENT:', process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT)
    console.log('- NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)

    // Parse request data
    const requestData = await request.json()
    console.log('📦 DEBUG: Request Data Received:', JSON.stringify(requestData, null, 2))

    const { amount, planName, billing, customerDetails } = requestData

    // Validate required fields
    if (!amount) {
      console.error('❌ DEBUG: Missing amount field')
      return NextResponse.json({ error: 'Missing amount field' }, { status: 400 })
    }
    if (!planName) {
      console.error('❌ DEBUG: Missing planName field')
      return NextResponse.json({ error: 'Missing planName field' }, { status: 400 })
    }

    console.log('✅ DEBUG: Required fields validated')

    // Initialize Cashfree with proper error handling
    console.log('🔧 DEBUG: Initializing Cashfree SDK...')
    
    try {
      Cashfree.XClientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID!
      Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!
      
      // Set environment correctly for v5.x
      if (process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION') {
        Cashfree.XEnvironment = Cashfree.Environment?.PRODUCTION || 'PRODUCTION'
      } else {
        Cashfree.XEnvironment = Cashfree.Environment?.SANDBOX || 'SANDBOX'
      }
      
      console.log('✅ DEBUG: Cashfree SDK initialized')
      console.log('- Environment set to:', Cashfree.XEnvironment)
    } catch (initError) {
      console.error('❌ DEBUG: Cashfree initialization failed:', initError)
      return NextResponse.json({ 
        error: 'Cashfree initialization failed',
        details: initError.message 
      }, { status: 500 })
    }

    // Create order request
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerDetails?.id || 'customer_001',
        customer_name: customerDetails?.name || 'Test User',
        customer_email: customerDetails?.email || 'user@example.com',
        customer_phone: customerDetails?.phone || '9999999999'
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/cashfree-webhook`
      },
      order_note: `${planName} Plan - ${billing} subscription`,
      order_tags: {
        planName,
        billing,
        source: 'web'
      }
    }

    console.log('📋 DEBUG: Order Request Created:', JSON.stringify(orderRequest, null, 2))

    // Try multiple methods based on SDK version
    console.log('🔄 DEBUG: Attempting to create order...')
    let response
    let method = 'unknown'

    try {
      // Method 1: Try PGCreateOrder with API version (most common for v5.x)
      method = 'PGCreateOrder with version'
      console.log('🔄 DEBUG: Trying method:', method)
      response = await Cashfree.PGCreateOrder('2023-08-01', orderRequest)
      console.log('✅ DEBUG: Method 1 succeeded')
    } catch (error1) {
      console.log('❌ DEBUG: Method 1 failed:', error1.message)
      
      try {
        // Method 2: Try PGCreateOrder without API version
        method = 'PGCreateOrder without version'
        console.log('🔄 DEBUG: Trying method:', method)
        response = await Cashfree.PGCreateOrder(orderRequest)
        console.log('✅ DEBUG: Method 2 succeeded')
      } catch (error2) {
        console.log('❌ DEBUG: Method 2 failed:', error2.message)
        
        try {
          // Method 3: Try direct API call as fallback
          method = 'Direct API call'
          console.log('🔄 DEBUG: Trying method:', method)
          
          const apiUrl = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
            ? 'https://api.cashfree.com/pg/orders'
            : 'https://sandbox.cashfree.com/pg/orders'

          const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-version': '2023-08-01',
              'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_APP_ID!,
              'x-client-secret': process.env.CASHFREE_SECRET_KEY!
            },
            body: JSON.stringify(orderRequest)
          })

          const apiData = await apiResponse.json()
          console.log('🌐 DEBUG: Direct API response status:', apiResponse.status)
          console.log('🌐 DEBUG: Direct API response data:', apiData)

          if (apiResponse.ok && apiData.order_id && apiData.payment_session_id) {
            response = { data: apiData }
            console.log('✅ DEBUG: Method 3 succeeded')
          } else {
            throw new Error(`Direct API call failed: ${JSON.stringify(apiData)}`)
          }
        } catch (error3) {
          console.error('❌ DEBUG: All methods failed')
          console.error('- Method 1 error:', error1.message)
          console.error('- Method 2 error:', error2.message)
          console.error('- Method 3 error:', error3.message)
          
          throw new Error(`All order creation methods failed. Last error: ${error3.message}`)
        }
      }
    }

    console.log('🎉 DEBUG: Order creation successful using:', method)
    console.log('📋 DEBUG: Cashfree Response:', JSON.stringify(response, null, 2))

    // Validate response
    if (response?.data?.order_id && response?.data?.payment_session_id) {
      console.log('✅ DEBUG: Response validation successful')
      
      const successResponse = {
        orderId: response.data.order_id,
        paymentSessionId: response.data.payment_session_id,
        orderStatus: response.data.order_status,
        amount: amount,
        method: method
      }
      
      console.log('📤 DEBUG: Sending success response:', successResponse)
      return NextResponse.json(successResponse)
    } else {
      console.error('❌ DEBUG: Invalid response structure:', response)
      throw new Error('Invalid response from Cashfree - missing required fields')
    }

  } catch (error: any) {
    console.error('💥 DEBUG: Fatal error in create-cashfree-order:')
    console.error('- Error name:', error.name)
    console.error('- Error message:', error.message)
    console.error('- Error stack:', error.stack)
    console.error('- Error response data:', error.response?.data)
    
    const errorResponse = {
      error: 'Failed to create order',
      message: error.message,
      details: error.response?.data || error.toString(),
      timestamp: new Date().toISOString()
    }
    
    console.log('📤 DEBUG: Sending error response:', errorResponse)
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
