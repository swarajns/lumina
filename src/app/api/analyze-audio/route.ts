import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// TypeScript interfaces
interface ActionItem {
  text: string
  priority: 'high' | 'medium' | 'low'
}

interface AnalysisResult {
  transcript: string
  summary: string
  actionItems: ActionItem[]
  keyPoints: string[]
}

interface Meeting {
  id: string
  title: string
  duration: number
  file_url: string
  file_size: number
  mime_type: string
  transcript: string
  summary: string
  source: string
  created_at?: string
}

interface FinalAnalysisResponse {
  meetingId: string
  transcript: string
  summary: string
  actionItems: Array<{
    id: string
    text: string
    completed: boolean
    priority: 'high' | 'medium' | 'low'
  }>
  keyPoints: string[]
  fileUrl: string
}

interface ErrorResponse {
  transcript: string
  summary: string
  actionItems: Array<{
    id: string
    text: string
    completed: boolean
    priority: 'high' | 'medium' | 'low'
  }>
  keyPoints: string[]
  error: string
}

// Helper function to clean text without problematic regex
function cleanResponseText(text: string): string {
  let cleaned = text.trim()
  
  // Remove common prefixes and suffixes using simple string operations
  const prefixes = ['``````', 'json:', 'JSON:', 'json', 'JSON']
  const suffixes = ['``````json']
  
  // Remove prefixes
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim()
      break
    }
  }
  
  // Remove suffixes
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.substring(0, cleaned.length - suffix.length).trim()
      break
    }
  }
  
  // Find JSON boundaries
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
  }
  
  return cleaned
}

export async function POST(request: NextRequest): Promise<NextResponse<FinalAnalysisResponse | ErrorResponse>> {
  try {
    console.log('🎙️ Starting audio analysis...')

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const title = (formData.get('title') as string) || 'Untitled Meeting'
    const duration = parseInt((formData.get('duration') as string) || '0')
    const source = (formData.get('source') as string) || 'record'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Step 1: Upload to Supabase Storage
    const timestamp = Date.now()
    const fileName = `recordings/${timestamp}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const fileBuffer = Buffer.from(await audioFile.arrayBuffer())

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, fileBuffer, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Storage upload failed:', uploadError)
      throw new Error('Failed to upload file to storage')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(uploadData.path)

    console.log('✅ File uploaded to:', publicUrl)

    // Step 2: AI Analysis with Better Prompting
    let analysis: AnalysisResult = {
      transcript: '',
      summary: '',
      actionItems: [],
      keyPoints: []
    }

    try {
      console.log('🤖 Starting Gemini AI analysis...')
      
      const base64Audio = fileBuffer.toString('base64')
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Enhanced prompt that specifically asks for action items
      const prompt = `Please analyze this audio recording and provide a detailed JSON response. 

IMPORTANT: Please identify any tasks, assignments, follow-ups, or things that need to be done mentioned in the audio. Even if they're implicit or suggested.

Return ONLY valid JSON in this exact format:
{
  "transcript": "Complete word-for-word transcription of everything said",
  "summary": "A 2-3 sentence summary of the main discussion",
  "actionItems": [
    {
      "text": "Specific task or action that needs to be done",
      "priority": "high"
    },
    {
      "text": "Another task mentioned",
      "priority": "medium"
    }
  ],
  "keyPoints": [
    "Key point 1 from the discussion",
    "Key point 2 from the discussion"
  ]
}

Examples of action items to look for:
- "We need to..." 
- "I'll do..."
- "Someone should..."
- "Let's make sure to..."
- "Don't forget to..."
- "Follow up on..."
- Any deadlines or commitments mentioned

If you cannot identify any clear action items, create at least one generic action item like "Review meeting content" or "Follow up on discussed topics".

Respond with ONLY the JSON object, no additional text.`

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: audioFile.type,
            data: base64Audio
          }
        },
        { text: prompt }
      ])

      const response = await result.response
      const text = response.text()

      console.log('🤖 Raw Gemini response:')
      console.log('Length:', text.length)
      console.log('First 500 chars:', text.substring(0, 500))
      console.log('Last 200 chars:', text.substring(Math.max(0, text.length - 200)))

      // Parse JSON with safe text cleaning
      try {
        const cleanedText = cleanResponseText(text)
        console.log('🧹 Cleaned text for parsing:')
        console.log(cleanedText.substring(0, 200) + '...')

        const parsedAnalysis = JSON.parse(cleanedText) as AnalysisResult
        
        // Validate and ensure proper structure
        analysis = {
          transcript: parsedAnalysis.transcript || '',
          summary: parsedAnalysis.summary || '',
          actionItems: Array.isArray(parsedAnalysis.actionItems) ? parsedAnalysis.actionItems : [],
          keyPoints: Array.isArray(parsedAnalysis.keyPoints) ? parsedAnalysis.keyPoints : []
        }
        
        console.log('✅ Successfully parsed JSON')
        console.log('Transcript length:', analysis.transcript?.length || 0)
        console.log('Summary length:', analysis.summary?.length || 0)
        console.log('Action items found:', analysis.actionItems?.length || 0)
        console.log('Key points found:', analysis.keyPoints?.length || 0)
        
        // Debug action items specifically
        if (analysis.actionItems && analysis.actionItems.length > 0) {
          console.log('📝 Action items details:')
          analysis.actionItems.forEach((item, index) => {
            console.log(`  ${index + 1}:`, item)
          })
        } else {
          console.log('⚠️  No action items found in AI response')
        }

      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError)
        console.log('Attempting to create structured response from text...')
        
        // Create fallback with forced action items
        analysis = {
          transcript: text.length > 50 ? text : `Audio processed: ${text}`,
          summary: `Meeting "${title}" analyzed. Audio content has been processed.`,
          actionItems: [
            { text: 'Review meeting transcript and key points', priority: 'medium' },
            { text: 'Follow up on discussed topics', priority: 'low' }
          ],
          keyPoints: [
            'Audio successfully processed',
            `File: ${audioFile.name}`,
            `Duration: ~${Math.floor(duration / 60)}m ${duration % 60}s`,
            'AI analysis completed'
          ]
        }
        
        console.log('📝 Created fallback action items:', analysis.actionItems.length)
      }

    } catch (aiError) {
      console.error('❌ AI processing failed:', aiError)
      
      // Force create action items even on AI failure
      analysis = {
        transcript: `Audio file "${title}" uploaded successfully but AI transcription failed. File available for manual review.`,
        summary: `Meeting "${title}" stored successfully. Manual transcription may be needed.`,
        actionItems: [
          { text: 'Manually review uploaded audio file', priority: 'high' },
          { text: 'Create meeting notes from audio', priority: 'medium' }
        ],
        keyPoints: [
          'Audio file stored successfully',
          'AI transcription encountered issues',
          'Manual review recommended'
        ]
      }
    }

    // Step 3: Save meeting to database
    console.log('💾 Saving meeting to database...')
    
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        title,
        duration: duration > 0 ? duration : Math.round(audioFile.size / 16000),
        file_url: publicUrl,
        file_size: audioFile.size,
        mime_type: audioFile.type,
        transcript: analysis.transcript,
        summary: analysis.summary,
        source: source
      })
      .select()
      .single() as { data: Meeting | null; error: unknown }

    if (meetingError || !meeting) {
      console.error('❌ Failed to save meeting:', meetingError)
      throw new Error('Database insert failed')
    }

    console.log('✅ Meeting saved with ID:', meeting.id)

    // Step 4: Save action items with extensive logging
    console.log('📝 Processing action items for database...')
    
    if (analysis.actionItems && Array.isArray(analysis.actionItems) && analysis.actionItems.length > 0) {
      console.log(`Found ${analysis.actionItems.length} action items to save`)
      
      const actionItemsData = analysis.actionItems.map((item: ActionItem, index: number) => ({
        meeting_id: meeting.id,
        text: item.text || `Action item ${index + 1}`,
        priority: item.priority || 'medium' as const
      }))

      console.log('💾 Inserting action items into database...')
      const { data: insertedActionItems, error: actionItemsError } = await supabase
        .from('action_items')
        .insert(actionItemsData)
        .select()

      if (actionItemsError) {
        console.error('❌ Failed to save action items:', actionItemsError)
      } else {
        console.log('✅ Successfully saved action items:', insertedActionItems?.length || 0)
      }
    } else {
      console.log('⚠️  No action items to save (creating default one)')
      
      // Force create at least one action item
      const defaultActionItem = {
        meeting_id: meeting.id,
        text: 'Review meeting content and extract action items',
        priority: 'medium' as const
      }
      
      const { error: defaultActionError } = await supabase
        .from('action_items')
        .insert([defaultActionItem])
      
      if (defaultActionError) {
        console.error('❌ Failed to save default action item:', defaultActionError)
      } else {
        console.log('✅ Created default action item')
        analysis.actionItems = [defaultActionItem]
      }
    }

    // Step 5: Save key points
    if (analysis.keyPoints && analysis.keyPoints.length > 0) {
      console.log(`💾 Saving ${analysis.keyPoints.length} key points...`)
      
      const keyPointsData = analysis.keyPoints.map((point: string) => ({
        meeting_id: meeting.id,
        text: point
      }))

      const { error: keyPointsError } = await supabase
        .from('key_points')
        .insert(keyPointsData)

      if (keyPointsError) {
        console.error('❌ Failed to save key points:', keyPointsError)
      } else {
        console.log('✅ Key points saved successfully')
      }
    }

    // Step 6: Return final response
    const finalAnalysis: FinalAnalysisResponse = {
      meetingId: meeting.id,
      transcript: analysis.transcript,
      summary: analysis.summary,
      actionItems: analysis.actionItems.map((item: ActionItem, index: number) => ({
        id: `action-${timestamp}-${index}`,
        text: item.text,
        completed: false,
        priority: item.priority
      })),
      keyPoints: analysis.keyPoints || [],
      fileUrl: publicUrl
    }

    console.log('🎉 Analysis completed successfully!')
    console.log('Final action items count:', finalAnalysis.actionItems.length)
    
    return NextResponse.json(finalAnalysis)

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('💥 Complete failure:', error)
    
    const errorResponse: ErrorResponse = {
      transcript: `Error: ${errorMessage}`,
      summary: 'Processing failed completely.',
      actionItems: [{
        id: `error-${Date.now()}`,
        text: 'Fix audio processing error and retry',
        completed: false,
        priority: 'high'
      }],
      keyPoints: ['Processing failed', 'Check logs'],
      error: errorMessage
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
