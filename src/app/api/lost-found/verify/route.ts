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

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1 
      }
    })

    // 1. Fetch original image
    console.log('Fetching original image:', originalImageUrl)
    const originalImageResp = await fetch(originalImageUrl)
    if (!originalImageResp.ok) {
      throw new Error(`Failed to fetch original image: ${originalImageResp.statusText}`)
    }
    const originalImageBuffer = await originalImageResp.arrayBuffer()
    const originalBase64 = Buffer.from(originalImageBuffer).toString('base64')

    // 2. Validate claimant image (should be pure base64)
    const cleanClaimantBase64 = resolutionImageBase64.replace(/^data:image\/\w+;base64,/, '')

    console.log('Original Base64 length:', originalBase64.length)
    console.log('Claimant Base64 length:', cleanClaimantBase64.length)

    const prompt = `You are a high-accuracy Owner Verification System. 
    Analyze two images of a university lost & found item. 
    Image 1: Original photo from the person who found it.
    Image 2: Verification photo from the person claiming to be the owner.

    TASK: 
    - Determine if Image 2 shows the EXACT physical item shown in Image 1.
    - LOOK FOR: Specific scratches, unique wear patterns, brand logo placement, cable twists, or distinct geometry.
    - IGNORE: Backgrounds, bedsheets, hands, lighting shadows, and different photo angles.
    - BE FORGIVING: If they look like the same unit but the second photo is slightly blurry or at a different angle, be helpful.

    JSON SCHEMA:
    {
      "match": boolean,
      "confidence": number (0-100),
      "reasoning": string (explain why it is or isn't a match based on specific physical markers)
    }`

    const result = await model.generateContent([
      {
        inlineData: {
          data: originalBase64,
          mimeType: 'image/jpeg'
        }
      },
      {
        inlineData: {
          data: cleanClaimantBase64,
          mimeType: 'image/jpeg'
        }
      },
      prompt
    ])

    const response = await result.response
    const text = response.text()
    console.log('AI Response:', text)

    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Verify API error:', error)
    return NextResponse.json({ 
      error: error.message || 'AI verification failed', 
      confidence: 0, 
      match: false,
      reasoning: 'Technical error during verification process'
    }, { status: 500 })
  }
}
