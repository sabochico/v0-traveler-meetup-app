import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 })
    }

    // Create unique filename
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `avatars/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    // Upload to Vercel Blob (private store)
    const blob = await put(filename, file, {
      access: "private",
    })

    // Return the pathname for use with /api/file route
    const fileUrl = `/api/file?pathname=${encodeURIComponent(blob.pathname)}`

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
