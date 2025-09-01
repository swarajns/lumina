import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Create supabase client for user verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🔍 API Route called - checking environment...')
  
  // Detailed environment checking
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { email, role, department, custom_message, invited_by } = await request.json()
    console.log('📧 Invite request for:', email)

    // Verify the requesting user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID()
    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${inviteToken}`

    console.log('🔗 Generated invite link:', inviteLink)

    // Send email via Resend
    console.log('📨 Attempting to send email via Resend...')
    
    const { data, error } = await resend.emails.send({
      from: 'Lumina Team <invites@yourdomain.com>', // Replace with YOUR verified domain
      to: [email],
      subject: `You've been invited to join our team!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">🎉 You're Invited!</h2>
          
          <p><strong>${invited_by}</strong> has invited you to join their team as a <strong>${role}</strong>.</p>
          
          ${custom_message ? `<p style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-style: italic;">"${custom_message}"</p>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Accept Invitation →
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return NextResponse.json({ 
        error: 'Failed to send invitation email', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Email sent successfully via Resend:', data?.id)

    // Store invitation in database (optional)
    try {
      const { error: dbError } = await supabase
        .from('user_invitations')
        .insert({
          email,
          role,
          department,
          custom_message,
          invited_by,
          invite_token: inviteToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })

      if (dbError) {
        console.warn('⚠️ Database insert failed, but email was sent:', dbError)
        // Don't fail the request - email was sent successfully
      }
    } catch (dbError) {
      console.warn('⚠️ Database operation failed, but email was sent:', dbError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      email_id: data?.id 
    })

  } catch (error) {
    console.error('💥 API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
