import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Accept either the old `note` field (legacy) or the new separate fields
    const body = await request.json()
    const foundAtNote: string = body.foundAt || ''
    const handedOffNote: string = body.handedOffTo || ''
    const legacyNote: string = body.note || ''

    const token = process.env.GITHUB_TOKEN

    if (!token) {
      console.error('GITHUB_TOKEN is not set')
      return NextResponse.json({
        structured: {
          discoveredAt: {
            label: foundAtNote || legacyNote || 'Unknown',
            raw: foundAtNote || legacyNote || '',
          },
          currentlyHeldAt: {
            label: handedOffNote || 'Unknown',
            raw: handedOffNote || '',
          },
        },
      })
    }

    // ── Parse "Found At" ─────────────────────────────────────────────────────
    const foundAtInput = foundAtNote || legacyNote
    let discoveredAt = { label: foundAtInput || 'Unknown', raw: foundAtInput }

    if (foundAtInput) {
      try {
        const res = await fetch('https://models.github.ai/inference/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You extract a clean, concise location label from a free-text description of where someone found a lost item.

RULES:
1. Keep ALL meaningful, specific location information that helps identify the spot (building names, area names, floor numbers, landmarks, specific spots).
2. Drop ONLY filler words: "i found it", "it was", "in the", "at the", "near the", "there was a", "i saw it", "it's in", "found at", etc. Prepositions like "at", "in", "near" are dropped ONLY when they are pure filler and not part of a named place.
3. ZERO assumptions – do not rename, expand, translate, or substitute the words the reporter used. If they said "cricket nets", output "Cricket Nets" — not "Sports Area" or "Campus".
4. Capitalise each meaningful word (title case).
5. Output only the clean label string – no JSON, no quotes, no explanation.

Examples:
  Input:  "i found it in the cricket nets near block c"
  Output: Cricket Nets, Near Block C

  Input:  "on the 3rd floor corridor of the EE building"
  Output: EE Building, 3rd Floor Corridor

  Input:  "left it on the bench outside the library"
  Output: Bench Outside Library`,
              },
              {
                role: 'user',
                content: foundAtInput,
              },
            ],
          }),
        })
        const data = await res.json()
        const label = data.choices?.[0]?.message?.content?.trim()
        if (label) discoveredAt = { label, raw: foundAtInput }
      } catch (err) {
        console.error('foundAt parse failed:', err)
      }
    }

    // ── Parse "Handed Off To / Submitted At" ────────────────────────────────
    let currentlyHeldAt = { label: handedOffNote || 'Not specified', raw: handedOffNote }

    if (handedOffNote) {
      try {
        const res = await fetch('https://models.github.ai/inference/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You extract a clean, concise label describing who or where an item was handed over to after being found.

RULES:
1. Keep ALL meaningful identifying information: the person/role type (guard, officer, admin, etc.), the specific location or identifier (gate number, room number, counter, desk, etc.), and any named place.
2. Drop ONLY filler words: "i handed it to", "i gave it to", "i submitted it to", "i left it with", "to the", "handed it over to", "gave to", etc.
3. ZERO assumptions – never invent, expand, or substitute the words the reporter used. If they said "guard at gate 2", output "Guard at Gate 2".
4. Capitalise each meaningful word (title case).
5. Output only the clean label string – no JSON, no quotes, no explanation.

Examples:
  Input:  "to the guard at gate 2"
  Output: Guard at Gate 2

  Input:  "gave it to the security officer near block a main entrance"
  Output: Security Officer, Block A Main Entrance

  Input:  "handed it to the academic office at admin block 2nd floor"
  Output: Academic Office, Admin Block 2nd Floor

  Input:  "left it as it is there"
  Output: Left in Place

  Input:  "left it on the table in the library"
  Output: Left on Table in Library`,
              },
              {
                role: 'user',
                content: handedOffNote,
              },
            ],
          }),
        })
        const data = await res.json()
        const label = data.choices?.[0]?.message?.content?.trim()
        if (label) currentlyHeldAt = { label, raw: handedOffNote }
      } catch (err) {
        console.error('handedOff parse failed:', err)
      }
    }

    return NextResponse.json({
      structured: {
        discoveredAt,
        currentlyHeldAt,
      },
    })
  } catch (error: unknown) {
    console.error('Handoff API error:', error)
    return NextResponse.json({ error: 'Failed to process handoff note' }, { status: 500 })
  }
}
