import { get } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get("url")
  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  const result = await get(blobUrl, { access: "private" })
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new NextResponse(result.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
