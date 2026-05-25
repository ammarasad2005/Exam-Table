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

    // Helper to calculate keyword overlap
    const getKeywordOverlapScore = (str1: string, str2: string): number => {
      const words1 = new Set((str1 || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set((str2 || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
      let intersection = 0;
      for (const w of words1) {
        if (words2.has(w)) intersection++;
      }
      return intersection;
    };

    // 3. Fetch linked item if present or execute advanced fallback matcher
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
    } else {
      // Fallback matching layer
      if (selectedItem.type === 'lost') {
        const email = selectedItem.contact_info?.trim().toLowerCase();
        if (email) {
          const { data: candidates } = await supabase
            .from("lost_found_items")
            .select("*")
            .eq("type", "found")
            .eq("is_resolved", true)
            .ilike("resolved_by", `%${email}%`);

          if (candidates && candidates.length > 0) {
            let bestCandidate = null;
            let bestScore = -1;

            for (const cand of candidates) {
              let score = 0;
              // Time proximity: resolved within 15 minutes (900,000 ms)
              const timeDiff = Math.abs(new Date(selectedItem.updated_at).getTime() - new Date(cand.updated_at).getTime());
              if (timeDiff <= 15 * 60 * 1000) {
                score += 10;
              }
              score += getKeywordOverlapScore(selectedItem.title, cand.title) * 2;
              score += getKeywordOverlapScore(selectedItem.description, cand.description);

              if (score > bestScore) {
                bestScore = score;
                bestCandidate = cand;
              }
            }

            if (bestCandidate) {
              linkedItem = {
                id: bestCandidate.id,
                type: bestCandidate.type,
                category: bestCandidate.category,
                title: bestCandidate.title,
                description: bestCandidate.description,
                location: bestCandidate.location,
                handoffNote: bestCandidate.handoff_note,
                parsedFoundAt: bestCandidate.parsed_found_at ?? undefined,
                parsedSubmittedAt: bestCandidate.parsed_submitted_at ?? undefined,
                rawFoundAt: bestCandidate.raw_found_at ?? undefined,
                rawSubmittedAt: bestCandidate.raw_submitted_at ?? undefined,
                date: bestCandidate.date,
                contactInfo: bestCandidate.contact_info,
                reporterName: bestCandidate.reporter_name,
                isResolved: bestCandidate.is_resolved,
                resolvedBy: bestCandidate.resolved_by,
                imageUrl: bestCandidate.image_url,
                resolutionImageUrl: bestCandidate.resolution_image_url,
                createdAt: bestCandidate.created_at,
                updatedAt: bestCandidate.updated_at,
              };
            }
          }
        }
      } else if (selectedItem.type === 'found') {
        let emailFromResolvedBy = null;
        if (selectedItem.resolved_by && selectedItem.resolved_by.includes('(') && selectedItem.resolved_by.includes(')')) {
          const match = selectedItem.resolved_by.match(/\(([^)]+)\)/);
          if (match) {
            emailFromResolvedBy = match[1].trim().toLowerCase();
          }
        }
        if (emailFromResolvedBy) {
          const { data: candidates } = await supabase
            .from("lost_found_items")
            .select("*")
            .eq("type", "lost")
            .eq("is_resolved", true)
            .eq("contact_info", emailFromResolvedBy);

          if (candidates && candidates.length > 0) {
            let bestCandidate = null;
            let bestScore = -1;

            for (const cand of candidates) {
              let score = 0;
              // Time proximity: resolved within 15 minutes (900,000 ms)
              const timeDiff = Math.abs(new Date(selectedItem.updated_at).getTime() - new Date(cand.updated_at).getTime());
              if (timeDiff <= 15 * 60 * 1000) {
                score += 10;
              }
              score += getKeywordOverlapScore(selectedItem.title, cand.title) * 2;
              score += getKeywordOverlapScore(selectedItem.description, cand.description);

              if (score > bestScore) {
                bestScore = score;
                bestCandidate = cand;
              }
            }

            if (bestCandidate) {
              linkedItem = {
                id: bestCandidate.id,
                type: bestCandidate.type,
                category: bestCandidate.category,
                title: bestCandidate.title,
                description: bestCandidate.description,
                location: bestCandidate.location,
                handoffNote: bestCandidate.handoff_note,
                parsedFoundAt: bestCandidate.parsed_found_at ?? undefined,
                parsedSubmittedAt: bestCandidate.parsed_submitted_at ?? undefined,
                rawFoundAt: bestCandidate.raw_found_at ?? undefined,
                rawSubmittedAt: bestCandidate.raw_submitted_at ?? undefined,
                date: bestCandidate.date,
                contactInfo: bestCandidate.contact_info,
                reporterName: bestCandidate.reporter_name,
                isResolved: bestCandidate.is_resolved,
                resolvedBy: bestCandidate.resolved_by,
                imageUrl: bestCandidate.image_url,
                resolutionImageUrl: bestCandidate.resolution_image_url,
                createdAt: bestCandidate.created_at,
                updatedAt: bestCandidate.updated_at,
              };
            }
          }
        }
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
    let claimerEmail = "fast.student@isb.nu.edu.pk";
    if (lostItem?.contactInfo && lostItem.contactInfo !== "not provided") {
      claimerEmail = lostItem.contactInfo;
    } else if (foundItem?.contactInfo && foundItem.contactInfo !== "not provided") {
      claimerEmail = foundItem.contactInfo;
    }

    claim = {
      id: `resolved-${selectedItem.id.slice(0, 8)}`,
      claimerId: claimerId || "anon",
      claimerEmail,
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
