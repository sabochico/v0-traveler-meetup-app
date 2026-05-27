import { put } from "@vercel/blob"
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
    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now())

    const user = await getAuthenticatedUser(request)
    if (!user) {
      console.warn("[upload]", requestId, "unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[upload]", requestId, "user", user.id)

    const contentType = request.headers.get("content-type") ?? ""
    let file: File | null = null

    if (contentType.includes("application/json")) {
      const body = await request.json()
      const base64 = body.file as string | undefined
      if (!base64) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }
      const buffer = Buffer.from(base64, "base64")
      file = new File([buffer], (body.fileName as string) || "avatar.jpg", {
        type: (body.contentType as string) || "image/jpeg",
      })
    } else {
      const formData = await request.formData()
      file = formData.get("file") as File
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const filename = `avatars/${user.id}/${Date.now()}.${ext}`

    const blob = await put(filename, file, {
      access: "public",
    })
    console.log("[upload]", requestId, "ok", blob.url)
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
