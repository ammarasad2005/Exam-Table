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
            content: `You are a campus information assistant. Analyze a "location note" for a lost & found item and extract structured data.
            Differentiate between WHERE the item was originally discovered (Found At) and WHERE it is currently held (Submitted At).
            
            Return ONLY a JSON object with this exact schema:
            {
              "discovered_at": {
                "building": string (e.g., "EE", "CS", "Cafeteria", "Main Gate", "Unknown"),
                "area": string (e.g., "Near the stairs", "In Lab 4", "Bench outside")
              },
              "currently_held_at": {
                "custodian": string (e.g., "Academic Office", "Guard", "None"),
                "building": string (e.g., "EE", "CS", "Main Gate", "Unknown"),
                "area": string (e.g., "On the desk", "In drawer")
              }
            }`
          },
          {
            role: "user",
            content: `Location note: "${note}"`
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
    
    const parsed = JSON.parse(content)
    
    // Map snake_case to camelCase for the frontend
    const structured = {
      discoveredAt: {
        building: parsed.discovered_at?.building || 'Unknown',
        area: parsed.discovered_at?.area || 'Unknown'
      },
      currentlyHeldAt: {
        custodian: parsed.currently_held_at?.custodian || 'None',
        building: parsed.currently_held_at?.building || 'Unknown',
        area: parsed.currently_held_at?.area || 'Unknown'
      }
    }

    return NextResponse.json({ structured })

  } catch (error: any) {
    console.error('GitHub Handoff API error:', error)
    return NextResponse.json({ error: 'Failed to process handoff note' }, { status: 500 })
  }
}
