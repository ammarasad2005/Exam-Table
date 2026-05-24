import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendVerificationRequestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { originalImageUrl, resolutionImageBase64, itemId, claimId } = await request.json();

    if (!originalImageUrl || !resolutionImageBase64 || !itemId) {
      return NextResponse.json({ error: 'Images and item ID are required' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('GITHUB_TOKEN is not set');
      return NextResponse.json({ match: false, confidence: 0, error: 'GitHub token not configured' });
    }

    // 1. Fetch original image
    const originalImageResp = await fetch(originalImageUrl);
    if (!originalImageResp.ok) throw new Error(`Original image fetch failed: ${originalImageResp.statusText}`);
    const originalImageBuffer = await originalImageResp.arrayBuffer();
    const originalBase64 = Buffer.from(originalImageBuffer).toString('base64');
    
    // 2. Clean claimant image base64
    const cleanClaimantBase64 = resolutionImageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are a high-accuracy Owner Verification System for university Lost & Found. 
    Analyze two images. 
    Image 1 (User URL): Original photo from the finder.
    Image 2 (Base64): Verification photo from the claimant.
    
    Determine if they show the EXACT SAME physical unit. 
    - IGNORE background, bedsheets, hands, and lighting.
    - FOCUS on branding, unique scratches, shape, and wear patterns.
    - BE HELPFUL and forgiving of minor angles or camera differences.
    
    Return ONLY a JSON object with this schema:
    {
      "match": boolean,
      "confidence": number (0-100),
      "reasoning": string
    }`;

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
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${originalBase64}`,
                  detail: "low"
                },
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanClaimantBase64}`,
                  detail: "low"
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub Vision API Error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from GitHub Vision');
    
    const parsed = JSON.parse(content);

    // Normalize keys defensively in case AI outputs different casing
    const normalized = {
      match: typeof parsed.match === 'boolean' ? parsed.match : (parsed.Match ?? parsed.MATCH ?? false),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : Number(parsed.Confidence ?? parsed.CONFIDENCE ?? parsed.score ?? parsed.Score ?? 0),
      reasoning: parsed.reasoning ?? parsed.Reasoning ?? parsed.REASONING ?? parsed.explanation ?? parsed.Explanation ?? 'No reasoning provided.'
    };

    // 4. If match is successful and we have context, update database
    if (normalized.match && normalized.confidence >= 80) {
      // a. Mark found item as resolved
      await supabase
        .from('lost_found_items')
        .update({ is_resolved: true })
        .eq('id', itemId);

      // b. If a claim is provided, resolve the linked lost item
      if (claimId) {
        const { data: claim } = await supabase
          .from('lost_found_claims')
          .select('*, lost_found_items(title)')
          .eq('id', claimId)
          .single();

        if (claim) {
          // Resolve linked lost item
          if (claim.lost_item_id) {
            await supabase
              .from('lost_found_items')
              .update({ is_resolved: true })
              .eq('id', claim.lost_item_id);
          }

          // Mark claim as verified
          await supabase
            .from('lost_found_claims')
            .update({ status: 'verified' })
            .eq('id', claimId);
        }
      }
    }

    return NextResponse.json(normalized);

  } catch (error: any) {
    console.error('GitHub Verify API error:', error);
    return NextResponse.json({ 
      error: error.message || 'AI verification failed', 
      confidence: 0, 
      match: false,
      reasoning: `Technical Error: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
