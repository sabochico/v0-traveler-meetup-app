import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAdminEmail } from "@/lib/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getAuthenticatedAdmin(request: NextRequest) {
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

  if (error || !user || !isAdminEmail(user.email)) return null
  return user
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await getAuthenticatedAdmin(request)
  const { userId } = await params

  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createAdminClient()
  const [{ data: profile, error: profileError }, { data: reports, error: reportsError }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, is_hidden_from_discovery, banned_at, banned_by, ban_reason")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("user_reports")
      .select("id, reporter_id, reported_id, reason, details, created_at")
      .eq("reported_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  if (profileError || reportsError) {
    console.error("[admin users] moderation lookup failed:", profileError ?? reportsError)
    return NextResponse.json({ error: "Could not load moderation data" }, { status: 500 })
  }

  return NextResponse.json({
    profile,
    reports: reports ?? [],
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await getAuthenticatedAdmin(request)
  const { userId } = await params

  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (adminUser.id === userId) {
    return NextResponse.json({ error: "Admins cannot hide themselves" }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const hidden = Boolean(body.hidden)
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 240) : null
  const payload = hidden
    ? {
      is_hidden_from_discovery: true,
      banned_at: new Date().toISOString(),
      banned_by: adminUser.id,
      ban_reason: reason || "Admin moderation",
      anonymous_mode: true,
    }
    : {
      is_hidden_from_discovery: false,
      banned_at: null,
      banned_by: null,
      ban_reason: null,
    }
  const admin = createAdminClient()

  const { error } = await admin
    .from("profiles")
    .update(payload)
    .eq("id", userId)

  if (error) {
    console.error("[admin users] moderation update failed:", error)
    return NextResponse.json({ error: "Could not update user moderation" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, hidden })
}
