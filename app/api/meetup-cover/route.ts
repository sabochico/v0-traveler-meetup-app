import { readdir } from "fs/promises"
import path from "path"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"])
const CATEGORY_ALIASES: Record<string, string[]> = {
  coffee: ["coffee"],
  food: ["food", "food adventure"],
  photo: ["photo", "photography"],
  walk: ["walk", "night walk"],
  study: ["study", "study session"],
  gaming: ["gaming"],
  explore: ["explore", "exploring"],
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function hash(value: string) {
  let result = 0
  for (let i = 0; i < value.length; i += 1) {
    result = (result * 31 + value.charCodeAt(i)) >>> 0
  }
  return result
}

async function getCategoryImages(category: string) {
  const root = path.join(process.cwd(), "public", "meetups")
  const folders = await readdir(root, { withFileTypes: true }).catch(() => [])
  const aliases = CATEGORY_ALIASES[category] ?? [category]
  const normalizedAliases = aliases.map(normalize)
  const folder = folders.find(
    (entry) => entry.isDirectory() && normalizedAliases.includes(normalize(entry.name))
  )

  if (!folder) return []

  const files = await readdir(path.join(root, folder.name), { withFileTypes: true }).catch(() => [])
  return files
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => `/meetups/${encodeURIComponent(folder.name)}/${encodeURIComponent(entry.name)}`)
    .sort()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") ?? "coffee"
  const seed = searchParams.get("seed") ?? category
  const random = searchParams.get("random") === "1"
  const json = searchParams.get("format") === "json"
  const images = await getCategoryImages(category)

  if (images.length === 0) {
    return json
      ? NextResponse.json({ imagePath: null })
      : NextResponse.json({ error: "No cover images found" }, { status: 404 })
  }

  const index = random ? Math.floor(Math.random() * images.length) : hash(seed) % images.length
  const imagePath = images[index]

  if (json) {
    return NextResponse.json({ imagePath })
  }

  return NextResponse.redirect(new URL(imagePath, request.url))
}
