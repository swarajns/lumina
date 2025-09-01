import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, workspaceName, role, inviteUrl, customMessage } = await request.json()

    const { data, error } = await resend.emails.send({
      from: 'no-reply@luminameeting.online', // ✅ Your verified domain
      to: email,
      subject: `🎉 You're invited to join ${workspaceName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin-bottom: 10px;">You're Invited! 🎉</h1>
            <p style="font-size: 18px; color: #6b7280;">
              You've been invited to join <strong style="color: #1f2937;">${workspaceName}</strong> 
              as a <strong style="color: #059669;">${role}</strong>
            </p>
          </div>
          
          ${customMessage ? `
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-style: italic;">"${customMessage}"</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background: linear-gradient(45deg, #3b82f6, #8b5cf6); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
              Accept Invitation
            </a>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">What's Next?</h3>
            <ul style="color: #6b7280; padding-left: 20px;">
              <li>Click the button above to accept your invitation</li>
              <li>Create your account or log in if you already have one</li>
              <li>Start collaborating with your team on Luminameeting</li>
            </ul>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 30px;">
            This invitation will expire in 7 days. If you have trouble clicking the button, 
            copy and paste this link: <br>
            <a href="${inviteUrl}" style="color: #3b82f6;">${inviteUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              You received this email because someone invited you to join their workspace on 
              <strong>Luminameeting</strong>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
              © 2025 Luminameeting. All rights reserved.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ Email sent successfully:', data)
    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('💥 Failed to send email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
