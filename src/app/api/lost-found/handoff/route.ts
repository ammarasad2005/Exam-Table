import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { note } = await request.json()

    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN
    if (!token) {
      console.error('GITHUB_TOKEN is not set')
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

    const response = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
      throw new Error(`GitHub API Error: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from GitHub Models')
    
    const structured = JSON.parse(content)
    return NextResponse.json({ structured })

  } catch (error: any) {
    console.error('GitHub Handoff API error:', error)
    return NextResponse.json({ error: 'Failed to process handoff note' }, { status: 500 })
  }
}
