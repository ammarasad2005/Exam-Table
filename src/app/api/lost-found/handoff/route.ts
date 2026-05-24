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
          discoveredAt: {
            building: 'Campus',
            area: 'Unknown Spot'
          },
          currentlyHeldAt: {
            custodian: 'None',
            building: 'Campus',
            area: 'Unknown Spot'
          }
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
            content: `You are a high-precision campus location parser for a university Lost & Found platform. 
            Your goal is to parse a text note describing an item's location and segment it into structured details.
            
            Strictly differentiate between:
            1. WHERE the item was originally found/lost (discovered_at)
            2. WHERE the item is currently kept for collection (currently_held_at)
            
            Normalization Rules:
            - Normalize building names: "Computer Science" or "CS Block" -> "CS", "Electrical Engineering" or "EE Block" -> "EE", "Business Administration" or "BBA Block" -> "BBA".
            - Normalize custodians: "security", "guard", "security guard" -> "Guard"; "office", "dept office", "academic office" -> "Academic Office"; "me" or "myself" or empty -> "None".
            
            Return ONLY a valid JSON object matching this schema:
            {
              "discovered_at": {
                "building": "CS" | "EE" | "BBA" | "Library" | "Cafeteria" | "Main Gate" | "Sports Ground" | "Admin Block" | "Unknown",
                "area": string (e.g., "In Lab 4", "Near stairs", "1st Floor lobby", "Unknown")
              },
              "currently_held_at": {
                "custodian": "Academic Office" | "Guard" | "Library Desk" | "Cafeteria Counter" | "None",
                "building": "CS" | "EE" | "BBA" | "Library" | "Cafeteria" | "Main Gate" | "Admin Block" | "Unknown",
                "area": string (e.g., "In drawer", "On table", "Security room", "None")
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
