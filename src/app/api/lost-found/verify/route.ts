import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

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
      
      const prompt = `You are an Owner Verification AI for a university Lost & Found platform. 
      Compare the original photo of a found item (Image 1) with a "proof of possession" photo (Image 2) taken by someone claiming to be the owner.
      
      STRICT INSTRUCTIONS:
      1. IGNORE the background, bedsheets, flooring, or hands holding the item.
      2. FOCUS on the object's identity: brand name, specific scratches, unique stickers, color shades, and physical geometry.
      3. BE FORGIVING of minor camera blur, different angles, or lighting shadows.
      4. If the objects look like the EXACT SAME physical unit (not just the same model, but the same specific item), return match: true.
      
      Return a JSON object with:
      "match": (boolean),
      "confidence": (number 0-100),
      "reasoning": (a very short sentence explaining what you saw)`

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
