import { get } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const pathname =
    request.nextUrl.searchParams.get("pathname") ??
    getLegacyAvatarPathname(request.nextUrl.searchParams.get("url"))

  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname parameter" }, { status: 400 })
  }

  if (!pathname.startsWith("avatars/") && !pathname.startsWith("meetup-covers/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await get(pathname, { access: "private" })
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new NextResponse(result.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  })
}

function getLegacyAvatarPathname(blobUrl: string | null): string | null {
  if (!blobUrl) return null

  try {
    const pathname = new URL(blobUrl).pathname.replace(/^\/+/, "")
    return pathname.startsWith("avatars/") ? pathname : null
  } catch {
    return null
  }
}
