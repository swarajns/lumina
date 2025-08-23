import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai'
import type { AIAnalysis } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

export async function analyzeAudio(audioBlob: Blob): Promise<AIAnalysis> {
  try {
    console.log('Starting AI analysis for blob:', {
      size: audioBlob.size,
      type: audioBlob.type
    })

    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty')
    }

    // For now, let's use a simple text-only fallback since audio upload via Files API 
    // requires server-side implementation due to CORS and API limitations
    
    // Create a mock analysis based on the audio file properties
    const duration = Math.round(audioBlob.size / 16000) // Rough estimate of duration in seconds
    
    const mockAnalysis: AIAnalysis = {
      transcript: `Audio file received successfully (${audioBlob.size} bytes, ${audioBlob.type}). Duration: approximately ${duration} seconds. This is a placeholder transcript - to enable real transcription, we need to implement server-side file upload to Gemini's Files API.`,
      summary: `Audio recording captured successfully. File size: ${(audioBlob.size / 1024).toFixed(1)} KB. Ready for processing when full API integration is implemented.`,
      actionItems: [
        {
          id: `action-${Date.now()}`,
          text: 'Implement server-side Gemini Files API integration for real transcription',
          completed: false,
          priority: 'medium' as const
        }
      ],
      keyPoints: [
        'Audio recording captured successfully',
        `File format: ${audioBlob.type}`,
        `File size: ${(audioBlob.size / 1024).toFixed(1)} KB`,
        'Ready for full AI processing'
      ]
    }

    console.log('Mock analysis completed successfully')
    return mockAnalysis

  } catch (error: any) {
    console.error('Error analyzing audio:', error)
    
    return {
      transcript: 'Error: Unable to process audio file.',
      summary: 'Audio processing encountered an error.',
      actionItems: [{
        id: `error-${Date.now()}`,
        text: 'Check audio format and try again',
        completed: false,
        priority: 'high' as const
      }],
      keyPoints: [
        'Audio processing failed',
        'Try different audio format',
        'Check file size'
      ]
    }
  }
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent("Say 'API connection working'")
    const response = await result.response
    const text = response.text()
    console.log('Gemini test response:', text)
    return text.toLowerCase().includes('working') || text.toLowerCase().includes('connection')
  } catch (error) {
    console.error('Gemini connection test failed:', error)
    return false
  }
}
