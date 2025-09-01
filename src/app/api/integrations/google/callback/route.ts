import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const redirectUri = process.env.GOOGLE_REDIRECT_URI

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return new NextResponse('Missing OAuth code', { status: 400 })
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId ?? '',
      client_secret: clientSecret ?? '',
      redirect_uri: redirectUri ?? '',
      grant_type: 'authorization_code'
    })
  })

  if (!tokenRes.ok) {
    return new NextResponse('Failed to exchange code for tokens', { status: 500 })
  }

  const tokenData = await tokenRes.json()
  /*
    tokenData includes:
    {
      access_token,
      expires_in,
      refresh_token,
      scope,
      token_type,
      id_token
    }
  */

  // TODO: Save tokens to your database under workspace_integrations for current workspace and user.

  // For now, just redirect to a success page or close popup
  return NextResponse.redirect(`${process.env.FRONTEND_URL}/integration-success`)
}
