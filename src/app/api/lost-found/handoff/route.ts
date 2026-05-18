import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { note } = await request.json()

    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set')
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

    const groq = new Groq({ apiKey })
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a campus information assistant. Analyze a "handoff note" for a lost & found item and extract structured location data.
          Return ONLY a JSON object with this exact schema:
          {
            "custodian": string (e.g., "Academic Office", "Guard", "None"),
            "building": string (e.g., "EE", "CS", "Cafeteria", "Main Gate", "Unknown"),
            "floor": string (e.g., "Ground", "1st", "None"),
            "specific_area": string (e.g., "Near the stairs", "On the desk"),
            "status": "static" | "custodial"
          }`
        },
        {
          role: 'user',
          content: `Handoff note: "${note}"`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from Groq')
    
    const structured = JSON.parse(content)
    return NextResponse.json({ structured })

  } catch (error: any) {
    console.error('Groq Handoff API error:', error)
    return NextResponse.json({ error: 'Failed to process handoff note' }, { status: 500 })
  }
}
