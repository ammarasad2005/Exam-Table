import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

// GET /api/lost-found/[id] - Get item details with claims
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: item, error } = await supabase
      .from("lost_found_items")
      .select("*, lost_found_claims(*)")
      .eq("id", id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const mappedItem = {
      id: item.id,
      type: item.type,
      category: item.category,
      title: item.title,
      description: item.description,
      location: item.location,
      handoffNote: item.handoff_note,
      structuredLocation: item.structured_location,
      date: item.date,
      contactInfo: item.contact_info,
      isResolved: item.is_resolved,
      resolvedBy: item.resolved_by,
      imageUrl: item.image_url,
      resolutionImageUrl: item.resolution_image_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      claims: item.lost_found_claims || [],
    };

    return NextResponse.json({ item: mappedItem });
  } catch (error) {
    console.error("Error fetching item details:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// PATCH /api/lost-found/[id] - Update a lost/found item (e.g., mark as resolved, register claim)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Handle "claim" action
    if (body.action === 'claim' && body.claimerId) {
      const { error: claimError } = await supabase
        .from('lost_found_claims')
        .insert({ item_id: id, claimer_id: body.claimerId });
      
      if (claimError) throw claimError;

      // Claim-Sync: Automatically resolve matching lost reports for this user
      if (body.claimerEmail) {
        const claimerEmail = body.claimerEmail.toLowerCase().trim();
        
        // 1. Fetch current found item details
        const { data: foundItem } = await supabase
          .from("lost_found_items")
          .select("*")
          .eq("id", id)
          .single();

        if (foundItem && foundItem.type === 'found') {
          // 2. Fetch all active lost items by this user's email
          const { data: lostItems } = await supabase
            .from("lost_found_items")
            .select("*")
            .eq("type", "lost")
            .eq("is_resolved", false)
            .eq("contact_info", claimerEmail);

          if (lostItems && lostItems.length > 0) {
            const token = process.env.GITHUB_TOKEN;
            if (token) {
              try {
                const lostItemsList = lostItems.map(li => `[ID: ${li.id}] Title: ${li.title}, Desc: ${li.description}`).join('\n');
                
                const syncResponse = await fetch("https://models.github.ai/inference/chat/completions", {
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
                        content: "You are a Lost & Found synchronization system. Compare a FOUND item with a list of LOST items reported by the same student. Determine if any of the LOST items are the same object as the FOUND item. Note that descriptions might vary slightly. Return ONLY a JSON object with 'matchId' (the ID string) and 'confidence' (0-100). If no match, return null for matchId."
                      },
                      {
                        role: "user",
                        content: `FOUND ITEM: ${foundItem.title} - ${foundItem.description}\n\nUSER'S LOST ITEMS:\n${lostItemsList}`
                      }
                    ],
                    response_format: { type: "json_object" }
                  })
                });

                if (syncResponse.ok) {
                  const syncData = await syncResponse.json();
                  const result = JSON.parse(syncData?.choices[0]?.message?.content || '{}');

                  if (result.matchId && result.confidence >= 80) {
                    console.log(`[Sync] Auto-resolving lost item ${result.matchId} for claimer ${claimerEmail}`);
                    await supabase
                      .from("lost_found_items")
                      .update({ is_resolved: true, resolved_by: body.claimerId })
                      .eq("id", result.matchId);
                  }
                }
              } catch (err) {
                console.error("Claim-Sync AI failed:", err);
              }
            }
          }
        }
      }
      
      return NextResponse.json({ success: true });
    }

    const { data: existingItem, error: fetchError } = await supabase
      .from("lost_found_items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.location !== undefined) updateData.location = body.location.trim();
    if (body.contactInfo !== undefined) updateData.contact_info = body.contactInfo.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl?.trim() || null;
    if (body.isResolved !== undefined) updateData.is_resolved = body.isResolved;
    if (body.resolvedBy !== undefined) updateData.resolved_by = body.resolvedBy;
    if (body.resolutionImageUrl !== undefined) updateData.resolution_image_url = body.resolutionImageUrl;
    if (body.date !== undefined) updateData.date = new Date(body.date).toISOString();

    const { data: item, error: updateError } = await supabase
      .from("lost_found_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If resolved, cleanup all claims for this item
    if (body.isResolved) {
      await supabase.from('lost_found_claims').delete().eq('item_id', id);
    }

    const mappedItem = {
      id: item.id,
      type: item.type,
      category: item.category,
      title: item.title,
      description: item.description,
      location: item.location,
      date: item.date,
      contactInfo: item.contact_info,
      isResolved: item.is_resolved,
      imageUrl: item.image_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };

    return NextResponse.json({ item: mappedItem });
  } catch (error) {
    console.error("Error updating lost/found item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

// DELETE /api/lost-found/[id] - Delete a lost/found item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: existingItem, error: fetchError } = await supabase
      .from("lost_found_items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("lost_found_items")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lost/found item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
