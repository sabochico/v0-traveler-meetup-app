import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) return null
  return user
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ meetupId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    const { meetupId } = await params

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!meetupId) {
      return NextResponse.json({ error: "Missing meetup id" }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: meetup, error: meetupError } = await admin
      .from("meetups")
      .select("id, creator_id")
      .eq("id", meetupId)
      .maybeSingle()

    if (meetupError) {
      console.error("[meetups] lookup failed:", meetupError)
      return NextResponse.json({ error: "Could not delete meetup" }, { status: 500 })
    }

    if (!meetup) {
      return NextResponse.json({ error: "Meetup not found" }, { status: 404 })
    }

    if (meetup.creator_id !== user.id) {
      return NextResponse.json({ error: "Only the creator can delete this meetup" }, { status: 403 })
    }

    await admin.from("notifications").delete().eq("related_meetup_id", meetupId)
    await admin.from("saved_meetups").delete().eq("meetup_id", meetupId)
    await admin.from("meetup_attendees").delete().eq("meetup_id", meetupId)

    const { error: deleteError } = await admin
      .from("meetups")
      .delete()
      .eq("id", meetupId)
      .eq("creator_id", user.id)

    if (deleteError) {
      console.error("[meetups] delete failed:", deleteError)
      return NextResponse.json({ error: "Could not delete meetup" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[meetups] unexpected delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
