import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { originalImageUrl, resolutionImageBase64 } = await request.json()

    if (!originalImageUrl || !resolutionImageBase64) {
      return NextResponse.json({ error: 'Both images are required' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set')
      return NextResponse.json({ match: false, confidence: 0, error: 'AI key not configured' })
    }

    const groq = new Groq({ apiKey })

    const cleanClaimantBase64 = resolutionImageBase64.replace(/^data:image\/\w+;base64,/, '')

    const prompt = `You are a high-accuracy Owner Verification System. 
    Analyze two images of a university lost & found item. 
    Image 1: Original photo from the person who found it.
    Image 2: Verification photo from the person claiming to be the owner.
    
    TASK: 
    - Determine if Image 2 shows the EXACT physical unit shown in Image 1.
    - LOOK FOR: Unique scratches, specific wear patterns, brand logo placement, cable twists, or distinct geometry.
    - IGNORE: Backgrounds, bedsheets, hands, lighting shadows, and different photo angles.
    - BE FORGIVING: If they look like the same unit but the second photo is slightly blurry or at a different angle, be helpful.
    
    Return ONLY a JSON object with this schema:
    {
      "match": boolean,
      "confidence": number (0-100),
      "reasoning": string (explain why it is or isn't a match based on specific physical markers)
    }`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: originalImageUrl,
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${cleanClaimantBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from Groq Vision')
    
    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Groq Verify API error:', error)
    return NextResponse.json({ 
      error: error.message || 'AI verification failed', 
      confidence: 0, 
      match: false,
      reasoning: `Technical Error: ${error.message || 'Unknown error'}`
    }, { status: 500 })
  }
}
