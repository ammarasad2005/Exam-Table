import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { note } = await request.json()

    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not set')
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://fast-exams.vercel.app", // Optional
        "X-Title": "FAST Schedule Platform" // Optional
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-plus:free",
        messages: [
          {
            role: "system",
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
            role: "user",
            content: `Handoff note: "${note}"`
          }
        ],
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API Error: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from OpenRouter')
    
    const structured = JSON.parse(content)
    return NextResponse.json({ structured })

  } catch (error: any) {
    console.error('OpenRouter Handoff API error:', error)
    return NextResponse.json({ error: 'Failed to process handoff note' }, { status: 500 })
  }
}
