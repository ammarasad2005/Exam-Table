import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { note } = await request.json()

    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN
    
    // Dynamically load the campus map rules file
    let rulesContent = ''
    try {
      const filePath = path.join(process.cwd(), 'docs/campus_map_rules.md')
      rulesContent = fs.readFileSync(filePath, 'utf8')
    } catch (err) {
      console.warn("Could not read docs/campus_map_rules.md, using defaults.", err)
    }

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
            
            CRITICAL: Follow a strict ZERO-ASSUMPTION policy. Do not attribute any assumption, external knowledge, or speculation to the user's message. Extract EVERYTHING entirely and literally from the user's given text note.
            
            STRICT MAPPING RULES:
            - Block A is NOT EE (Electrical Engineering) and EE is NOT Block A.
            - Block B is NOT CS (Computer Science) and CS is NOT Block B.
            - Do NOT map, translate, associate, or substitute these terms.
            - If the text note says "EE" or "EE Block", the building MUST be extracted as "EE Block" or "EE", NOT "Block A".
            - If the text note says "Block A", the building MUST be extracted as "Block A", NOT "EE" or "EE Block".
            - If the text note says "CS" or "CS Block", the building MUST be extracted as "CS Block" or "CS", NOT "Block B".
            - If the text note says "Block B", the building MUST be extracted as "Block B", NOT "CS" or "CS Block".
            
            Strictly follow these campus map guidelines, zero-assumption rules, and custodian behaviors:
            ${rulesContent || 'Parse building names and custodians.'}
            
            Return ONLY a valid JSON object matching this exact schema:
            {
              "discovered_at": {
                "building": string (the exact name of the building or structure extracted from the note, or "Unknown" if not specified),
                "area": string (the specific area, room, floor, or walkway inside or near that building, or "Unknown" if not specified)
              },
              "currently_held_at": {
                "custodian": "Academic Office" | "Guard" | "Library Desk" | "Cafeteria Counter" | "None",
                "building": string (the building where the item is currently held/located, or "None", or "Unknown"),
                "area": string (the specific spot, drawer, table, or custody status where it is held, or "None")
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
