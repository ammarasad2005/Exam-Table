import { NextRequest, NextResponse } from 'next/server'

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

        // Simple Levenshtein-like similarity for short queries
        if (queryWords.length === 1 && queryLower.length >= 3) {
          const word = queryWords[0]
          const titleWords = titleLower.split(/\s+/)
          for (const tw of titleWords) {
            if (tw.length >= 3 && levenshtein(word, tw) <= 3) {
              score += 2
            }
          }
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

    // Try to use LLM if available
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const llmSuggestions = await generateAISuggestions(ZAI, query, suggestions, alternatives)
      if (llmSuggestions) {
        return NextResponse.json(llmSuggestions)
      }
    } catch {
      // LLM not available, use rule-based results
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

async function generateAISuggestions(
  ZAI: unknown,
  query: string,
  localSuggestions: unknown[],
  localAlternatives: string[]
) {
  try {
    // @ts-expect-error - dynamic import
    const response = await ZAI.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for a university Lost & Found system. Given a search query and some local results, suggest alternative search terms that might help the user find what they're looking for. Be concise. Return JSON with "alternatives" (array of 3-5 short search phrases) and "suggestion" (a brief helpful tip).`,
        },
        {
          role: 'user',
          content: `User searched for: "${query}". Local results found: ${localSuggestions.length}. Some categories seen: ${localAlternatives.join(', ')}. Suggest alternative search terms.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    const content = response.choices?.[0]?.message?.content
    if (content) {
      try {
        const parsed = JSON.parse(content)
        return {
          suggestions: localSuggestions,
          alternatives: parsed.alternatives || localAlternatives.slice(0, 4),
          aiSuggestion: parsed.suggestion || null,
          source: 'ai',
        }
      } catch {
        // Not valid JSON, return with raw AI suggestion
        return {
          suggestions: localSuggestions,
          alternatives: localAlternatives.slice(0, 4),
          aiSuggestion: content.slice(0, 150),
          source: 'ai',
        }
      }
    }
  } catch {
    // AI call failed
  }
  return null
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}
