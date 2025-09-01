import { NextResponse } from 'next/server'

const clientId = process.env.GOOGLE_CLIENT_ID
const redirectUri = process.env.GOOGLE_REDIRECT_URI

export async function GET() {
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid')
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`

  return NextResponse.redirect(oauthUrl)
}
