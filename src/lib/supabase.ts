import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Meeting = {
  id: string
  title: string | null
  duration: number
  file_url: string | null
  file_size: number | null
  mime_type: string | null
  transcript: string | null
  summary: string | null
  created_at: string
  updated_at: string
}

export type ActionItem = {
  id: string
  meeting_id: string
  text: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  created_at: string
}

export type KeyPoint = {
  id: string
  meeting_id: string
  text: string
  created_at: string
}

export interface Note {
  id: string
  meeting_id: string
  content: string
  created_at: string
  updated_at: string
}
