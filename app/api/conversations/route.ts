import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const otherUserId = body.otherUserId as string | undefined
    if (!otherUserId) {
      return NextResponse.json({ error: "otherUserId is required" }, { status: 400 })
    }

    // Service role client bypasses RLS entirely
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if a conversation already exists between the two users
    const { data: myParticipations } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (myParticipations?.length) {
      for (const part of myParticipations) {
        const { data: otherPart } = await admin
          .from("conversation_participants")
          .select("conversation_id")
          .eq("conversation_id", part.conversation_id)
          .eq("user_id", otherUserId)
          .single()

        if (otherPart) {
          return NextResponse.json({ conversationId: part.conversation_id, isNew: false })
        }
      }
    }

    // Create the conversation row
    const { data: newConv, error: convError } = await admin
      .from("conversations")
      .insert({})
      .select()
      .single()

    if (convError || !newConv) {
      console.error("[conversations] insert conversation failed:", convError)
      return NextResponse.json(
        { error: convError?.message ?? "Failed to create conversation" },
        { status: 500 }
      )
    }

    // Add both participants in one call
    const { error: partError } = await admin
      .from("conversation_participants")
      .insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ])

    if (partError) {
      console.error("[conversations] insert participants failed:", partError)
      return NextResponse.json({ error: partError.message }, { status: 500 })
    }

    return NextResponse.json({ conversationId: newConv.id, isNew: true })
  } catch (error) {
    console.error("[conversations] unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
