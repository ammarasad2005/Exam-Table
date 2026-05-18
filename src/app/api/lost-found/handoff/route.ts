import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { note } = await request.json()

    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_GENAI_API_KEY is not set')
      return NextResponse.json({ 
        structured: { 
          custodian: 'None', 
          building: 'Campus', 
          floor: 'None', 
          specific_area: 'None', 
          status: 'static' 
        } 
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    })

    const prompt = `Analyze this university lost & found "handoff note" and extract structured location data.
    Determine if the item was left somewhere (static) or handed to someone/office (custodial).
    
    Return ONLY a JSON object with this exact schema:
    {
      "custodian": string (e.g., "Academic Office", "Guard", "None"),
      "building": string (e.g., "EE", "CS", "Cafeteria", "Main Gate", "Unknown"),
      "floor": string (e.g., "Ground", "1st", "None"),
      "specific_area": string (e.g., "Near the stairs", "On the desk"),
      "status": "static" | "custodial"
    }
    
    Note: "${note}"`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    let structured = JSON.parse(text)

    return NextResponse.json({ structured })
  } catch (error) {
    console.error('Handoff API error:', error)
    return NextResponse.json({ error: 'Failed to process handoff note' }, { status: 500 })
  }
}
