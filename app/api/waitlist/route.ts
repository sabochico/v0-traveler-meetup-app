import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await admin
      .from("launch_waitlist")
      .upsert(
        {
          email,
          name: typeof body.name === "string" ? body.name.trim() || null : null,
          city: typeof body.city === "string" ? body.city.trim() || null : null,
          country: typeof body.country === "string" ? body.country.trim() || null : null,
          nearest_launch_city:
            typeof body.nearestLaunchCity === "string" ? body.nearestLaunchCity.trim() || null : null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not join waitlist." },
      { status: 500 }
    )
  }
}
