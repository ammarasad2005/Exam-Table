import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Fetch the selected item
    const { data: selectedItem, error: fetchError } = await supabase
      .from("lost_found_items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !selectedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    let foundItem = null;
    let lostItem = null;
    let claim = null;

    // 2. Parse resolved_by to see if it holds a linked item ID
    let linkedItemId = null;
    let claimerId = selectedItem.resolved_by;

    if (selectedItem.resolved_by && selectedItem.resolved_by.includes(':')) {
      const parts = selectedItem.resolved_by.split(':');
      claimerId = parts[0];
      linkedItemId = parts[1];
    }

    // 3. Fetch linked item if present
    let linkedItem = null;
    if (linkedItemId) {
      const { data: lItem } = await supabase
        .from("lost_found_items")
        .select("*")
        .eq("id", linkedItemId)
        .single();
      if (lItem) {
        linkedItem = {
          id: lItem.id,
          type: lItem.type,
          category: lItem.category,
          title: lItem.title,
          description: lItem.description,
          location: lItem.location,
          handoffNote: lItem.handoff_note,
          parsedFoundAt: lItem.parsed_found_at ?? undefined,
          parsedSubmittedAt: lItem.parsed_submitted_at ?? undefined,
          rawFoundAt: lItem.raw_found_at ?? undefined,
          rawSubmittedAt: lItem.raw_submitted_at ?? undefined,
          date: lItem.date,
          contactInfo: lItem.contact_info,
          reporterName: lItem.reporter_name,
          isResolved: lItem.is_resolved,
          resolvedBy: lItem.resolved_by,
          imageUrl: lItem.image_url,
          resolutionImageUrl: lItem.resolution_image_url,
          createdAt: lItem.created_at,
          updatedAt: lItem.updated_at,
        };
      }
    }

    const mappedSelected = {
      id: selectedItem.id,
      type: selectedItem.type,
      category: selectedItem.category,
      title: selectedItem.title,
      description: selectedItem.description,
      location: selectedItem.location,
      handoffNote: selectedItem.handoff_note,
      parsedFoundAt: selectedItem.parsed_found_at ?? undefined,
      parsedSubmittedAt: selectedItem.parsed_submitted_at ?? undefined,
      rawFoundAt: selectedItem.raw_found_at ?? undefined,
      rawSubmittedAt: selectedItem.raw_submitted_at ?? undefined,
      date: selectedItem.date,
      contactInfo: selectedItem.contact_info,
      reporterName: selectedItem.reporter_name,
      isResolved: selectedItem.is_resolved,
      resolvedBy: selectedItem.resolved_by,
      imageUrl: selectedItem.image_url,
      resolutionImageUrl: selectedItem.resolution_image_url,
      createdAt: selectedItem.created_at,
      updatedAt: selectedItem.updated_at,
    };

    if (selectedItem.type === "found") {
      foundItem = mappedSelected;
      lostItem = linkedItem;
    } else {
      lostItem = mappedSelected;
      foundItem = linkedItem;
    }

    // 4. Synthesize claim info for display using the data we have
    claim = {
      id: `resolved-${selectedItem.id.slice(0, 8)}`,
      claimerId: claimerId || "anon",
      claimerEmail: foundItem?.contactInfo || lostItem?.contactInfo || "fast.student@isb.nu.edu.pk",
      status: "verified",
      createdAt: selectedItem.updated_at,
    };

    return NextResponse.json({
      claim,
      foundItem,
      lostItem,
    });
  } catch (error: any) {
    console.error("Fetch resolution pair error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch resolution pair" },
      { status: 500 }
    );
  }
}
