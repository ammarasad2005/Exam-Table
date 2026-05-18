import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const { originalImageUrl, resolutionImageBase64 } = await request.json()

    if (!originalImageUrl || !resolutionImageBase64) {
      return NextResponse.json({ error: 'Both images are required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_GENAI_API_KEY is not set')
      return NextResponse.json({ match: false, confidence: 0, error: 'AI key not configured' })
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      })

      // Fetch original image as bytes
      const originalImageResp = await fetch(originalImageUrl)
      const originalImageBuffer = await originalImageResp.arrayBuffer()
      
      const prompt = `You are a visual verification system for a university Lost & Found platform. 
      Compare the original photo of a found item (Image 1) with a "proof of possession" photo provided by a claimant (Image 2).
      
      Determine if they are the EXACT SAME physical object. Look for unique scratches, brand markings, colors, and specific wear patterns.
      
      Return a JSON object with:
      "match": (boolean),
      "confidence": (number 0-100),
      "reasoning": (short string explaining the decision)`

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: Buffer.from(originalImageBuffer).toString('base64'),
            mimeType: 'image/jpeg'
          }
        },
        {
          inlineData: {
            data: resolutionImageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ])

      const content = result.response.text()
      if (content) {
        const parsed = JSON.parse(content)
        return NextResponse.json(parsed)
      }
    } catch (error) {
      console.error('Vision matching failed:', error)
      return NextResponse.json({ error: 'AI verification failed', confidence: 0, match: false }, { status: 500 })
    }

    return NextResponse.json({ match: false, confidence: 0 })
  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json({ error: 'Failed to verify images' }, { status: 500 })
  }
}
