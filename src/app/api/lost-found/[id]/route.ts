import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PATCH /api/lost-found/[id] - Update a lost/found item (e.g., mark as resolved)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

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
    if (body.date !== undefined) updateData.date = new Date(body.date).toISOString();

    const { data: item, error: updateError } = await supabase
      .from("lost_found_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

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
