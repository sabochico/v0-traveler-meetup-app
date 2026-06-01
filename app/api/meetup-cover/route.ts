import { type NextRequest, NextResponse } from "next/server"
import { getMeetupCoverImage, getRandomMeetupCoverImage } from "@/lib/meetup-cover-images"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") ?? "coffee"
  const seed = searchParams.get("seed") ?? category
  const random = searchParams.get("random") === "1"
  const json = searchParams.get("format") === "json"
  const imagePath = random
    ? getRandomMeetupCoverImage(category)
    : getMeetupCoverImage(category, seed)

  if (!imagePath) {
    return json
      ? NextResponse.json({ imagePath: null })
      : NextResponse.json({ error: "No cover images found" }, { status: 404 })
  }

  if (json) {
    return NextResponse.json({ imagePath })
  }

  return NextResponse.redirect(new URL(imagePath, request.url))
}
