import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { query, items } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ suggestions: [], alternatives: [] })
    }

    const queryLower = query.toLowerCase().trim()
    const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2)

    // Find similar items using keyword matching and fuzzy logic
    const scored = items
      .filter((item: { isResolved?: boolean }) => !item.isResolved)
      .map((item: { id?: string; title?: string; description?: string; category?: string; location?: string; type?: string; createdAt?: string }) => {
        let score = 0
        const titleLower = (item.title || '').toLowerCase()
        const descLower = (item.description || '').toLowerCase()
        const catLower = (item.category || '').toLowerCase()
        const locLower = (item.location || '').toLowerCase()

        // Word match scoring
        for (const word of queryWords) {
          if (titleLower.includes(word)) score += 3
          if (descLower.includes(word)) score += 2
          if (catLower.includes(word)) score += 2
          if (locLower.includes(word)) score += 1
        }

        // Partial match bonus
        if (queryLower.length >= 3) {
          if (titleLower.includes(queryLower)) score += 5
          if (descLower.includes(queryLower)) score += 3
        }

        return { ...item, score }
      })
      .filter((item: { score: number }) => item.score > 0)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)

    const suggestions = scored.slice(0, 5).map((item: { id?: string; title?: string; type?: string; category?: string; location?: string; createdAt?: string; score?: number }) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      category: item.category,
      location: item.location,
      createdAt: item.createdAt,
      relevanceScore: item.score,
    }))

    // Generate alternative search terms
    const categories = [...new Set(scored.slice(0, 10).map((i: { category?: string }) => i.category))]
    const locations = [...new Set(scored.slice(0, 10).map((i: { location?: string }) => i.location))]

    const alternatives: string[] = []
    if (categories.length > 0) alternatives.push(...(categories.slice(0, 2).filter(Boolean) as string[]))
    if (locations.length > 0) alternatives.push(...(locations.slice(0, 2).filter(Boolean) as string[]))

    // Try to use Gemini for AI fallback
    const apiKey = process.env.GOOGLE_GENAI_API_KEY
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: "application/json" }
        })

        const prompt = `You are a helpful assistant for a university Lost & Found system. 
        Given a user's search query and some local results, suggest alternative search terms that might help them find their belongings. 
        Be concise.
        
        User searched for: "${query}"
        Local results found: ${suggestions.length}
        Categories present: ${alternatives.join(', ')}
        
        Return a JSON object with:
        "alternatives": (array of 3-5 short search phrases),
        "suggestion": (a single brief helpful tip string)`

        const result = await model.generateContent(prompt)
        const content = result.response.text()
        
        if (content) {
          const parsed = JSON.parse(content)
          return NextResponse.json({
            suggestions,
            alternatives: parsed.alternatives || alternatives.slice(0, 4),
            aiSuggestion: parsed.suggestion || null,
            source: 'ai',
          })
        }
      } catch (err) {
        console.error('Gemini Smart Search failed:', err)
      }
    }

    return NextResponse.json({
      suggestions,
      alternatives: alternatives.slice(0, 4),
      source: 'local',
    })
  } catch (error) {
    console.error('Smart search error:', error)
    return NextResponse.json({ error: 'Smart search failed' }, { status: 500 })
  }
}
