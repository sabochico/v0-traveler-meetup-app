import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Create unique filename with user ID
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `avatars/${user.id}/${Date.now()}.${ext}`

    // Upload to Vercel Blob (private access - serve through API)
    const blob = await put(filename, file, {
      access: "private",
    })

    // For private blobs, we need to store the pathname and serve through an API route
    // But for simplicity, we'll update the profile with the download URL
    // The blob.url works for downloading, we just need to use our file API to serve it
    const fileUrl = `/api/file?pathname=${encodeURIComponent(blob.pathname)}`

    // Update user profile with new avatar URL
    await supabase
      .from("profiles")
      .update({ avatar_url: fileUrl })
      .eq("id", user.id)

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
