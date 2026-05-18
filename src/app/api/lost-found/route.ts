import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/lost-found - List all lost/found items with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "lost" or "found"
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const resolved = searchParams.get("resolved");

    let query = supabase
      .from("lost_found_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (type && (type === "lost" || type === "found")) {
      query = query.eq("type", type);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (resolved !== null && resolved !== undefined) {
      query = query.eq("is_resolved", resolved === "true");
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data: items, error } = await query;

    if (error) throw error;

    // Map snake_case to camelCase to match the frontend model
    const mappedItems = items.map((item) => ({
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
    }));

    return NextResponse.json({ items: mappedItems });
  } catch (error) {
    console.error("Error fetching lost/found items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/lost-found - Create a new lost/found item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      category,
      title,
      description,
      location,
      handoffNote,
      structuredLocation,
      date,
      contactInfo,
      imageUrl,
    } = body;

    // Validation
    if (!type || !["lost", "found"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'lost' or 'found'" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Description must be at least 5 characters" },
        { status: 400 }
      );
    }

    if (!location || location.trim().length < 2) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "Electronics",
      "Documents",
      "Accessories",
      "Clothing",
      "Keys",
      "Bags",
      "Books",
      "Other",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from("lost_found_items")
      .insert({
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        handoff_note: handoffNote,
        structured_location: structuredLocation,
        date: new Date(date).toISOString(),
        contact_info: contactInfo.trim(),
        image_url: imageUrl?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

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
      imageUrl: item.image_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };

    return NextResponse.json({ item: mappedItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating lost/found item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
