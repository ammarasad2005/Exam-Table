import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Find the verified claim linking the items
    const { data: claim, error: claimError } = await supabase
      .from("lost_found_claims")
      .select("*")
      .or(`item_id.eq.${id},lost_item_id.eq.${id}`)
      .eq("status", "verified")
      .maybeSingle();

    if (claimError) {
      console.error("Error fetching claim for resolution:", claimError);
    }

    let foundItem = null;
    let lostItem = null;

    if (claim) {
      // Fetch both items if claim exists
      if (claim.item_id) {
        const { data: fItem } = await supabase
          .from("lost_found_items")
          .select("*")
          .eq("id", claim.item_id)
          .single();
        if (fItem) {
          foundItem = {
            id: fItem.id,
            type: fItem.type,
            category: fItem.category,
            title: fItem.title,
            description: fItem.description,
            location: fItem.location,
            handoffNote: fItem.handoff_note,
            parsedFoundAt: fItem.parsed_found_at ?? undefined,
            parsedSubmittedAt: fItem.parsed_submitted_at ?? undefined,
            rawFoundAt: fItem.raw_found_at ?? undefined,
            rawSubmittedAt: fItem.raw_submitted_at ?? undefined,
            date: fItem.date,
            contactInfo: fItem.contact_info,
            reporterName: fItem.reporter_name,
            isResolved: fItem.is_resolved,
            resolvedBy: fItem.resolved_by,
            imageUrl: fItem.image_url,
            resolutionImageUrl: fItem.resolution_image_url,
            createdAt: fItem.created_at,
            updatedAt: fItem.updated_at,
          };
        }
      }

      if (claim.lost_item_id) {
        const { data: lItem } = await supabase
          .from("lost_found_items")
          .select("*")
          .eq("id", claim.lost_item_id)
          .single();
        if (lItem) {
          lostItem = {
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
    } else {
      // Fallback: if no claim found, just fetch the single item
      const { data: singleItem } = await supabase
        .from("lost_found_items")
        .select("*")
        .eq("id", id)
        .single();
      if (singleItem) {
        const mapped = {
          id: singleItem.id,
          type: singleItem.type,
          category: singleItem.category,
          title: singleItem.title,
          description: singleItem.description,
          location: singleItem.location,
          handoffNote: singleItem.handoff_note,
          parsedFoundAt: singleItem.parsed_found_at ?? undefined,
          parsedSubmittedAt: singleItem.parsed_submitted_at ?? undefined,
          rawFoundAt: singleItem.raw_found_at ?? undefined,
          rawSubmittedAt: singleItem.raw_submitted_at ?? undefined,
          date: singleItem.date,
          contactInfo: singleItem.contact_info,
          reporterName: singleItem.reporter_name,
          isResolved: singleItem.is_resolved,
          resolvedBy: singleItem.resolved_by,
          imageUrl: singleItem.image_url,
          resolutionImageUrl: singleItem.resolution_image_url,
          createdAt: singleItem.created_at,
          updatedAt: singleItem.updated_at,
        };
        if (mapped.type === "found") {
          foundItem = mapped;
        } else {
          lostItem = mapped;
        }
      }
    }

    return NextResponse.json({
      claim: claim ? {
        id: claim.id,
        claimerId: claim.claimer_id,
        claimerEmail: claim.claimer_email,
        status: claim.status,
        createdAt: claim.created_at,
      } : null,
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
