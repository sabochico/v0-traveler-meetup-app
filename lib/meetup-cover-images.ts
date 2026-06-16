const MEETUP_COVER_IMAGES: Record<string, string[]> = {
  coffee: [
    "/meetups/coffee/coffee 1.webp",
    "/meetups/coffee/coffee 2.webp",
    "/meetups/coffee/coffee 3.webp",
    "/meetups/coffee/coffee 4.webp",
  ],
  food: [
    "/meetups/food adventure/food 1.webp",
    "/meetups/food adventure/food 2.webp",
    "/meetups/food adventure/food 3.webp",
    "/meetups/food adventure/food 4.webp",
    "/meetups/food adventure/food 5.webp",
  ],
  photo: [
    "/meetups/photography/photo 1.webp",
    "/meetups/photography/photo 2.webp",
    "/meetups/photography/photo 3.webp",
    "/meetups/photography/photo 4.webp",
    "/meetups/photography/photo 5.webp",
  ],
  walk: [
    "/meetups/night walk/night walk 1.webp",
    "/meetups/night walk/night walk 2.webp",
    "/meetups/night walk/night walk 3.webp",
    "/meetups/night walk/night walk 4.webp",
    "/meetups/night walk/night walk 5.webp",
  ],
  study: [
    "/meetups/study session/study 1.webp",
    "/meetups/study session/study 2.webp",
    "/meetups/study session/study 3.webp",
    "/meetups/study session/study 4.webp",
  ],
  gaming: [
    "/meetups/gaming/gaming 1.webp",
    "/meetups/gaming/gaming 2.webp",
    "/meetups/gaming/gaming 3.webp",
    "/meetups/gaming/gaming 4.webp",
    "/meetups/gaming/gaming 5.webp",
  ],
  explore: [
    "/meetups/exploring/exploring 1.webp",
    "/meetups/exploring/exploring 2.webp",
    "/meetups/exploring/exploring 3.webp",
    "/meetups/exploring/explring 4.webp",
  ],
}

const CATEGORY_ALIASES: Record<string, string> = {
  coffee: "coffee",
  cafe: "coffee",
  exploring: "explore",
  explore: "explore",
  travel: "explore",
  gaming: "gaming",
  games: "gaming",
  food: "food",
  "food adventure": "food",
  "street food": "food",
  study: "study",
  "study session": "study",
  "language exchange": "study",
  language: "study",
  workspace: "study",
  coworking: "study",
  "co-working": "study",
  walking: "walk",
  walk: "walk",
  "night walk": "walk",
  photography: "photo",
  photo: "photo",
  anime: "gaming",
}

function normalizeCategory(category: string) {
  return category.trim().toLowerCase()
}

function getCategoryImageKey(category: string) {
  return CATEGORY_ALIASES[normalizeCategory(category)] ?? normalizeCategory(category)
}

function hash(value: string) {
  let result = 0
  for (let i = 0; i < value.length; i += 1) {
    result = (result * 31 + value.charCodeAt(i)) >>> 0
  }
  return result
}

export function getMeetupCoverImage(category: string, seed: string) {
  const images = MEETUP_COVER_IMAGES[getCategoryImageKey(category)] ?? []
  if (images.length === 0) return null
  return images[hash(seed) % images.length]
}

export function getRandomMeetupCoverImage(category: string) {
  const images = MEETUP_COVER_IMAGES[getCategoryImageKey(category)] ?? []
  if (images.length === 0) return null
  return images[Math.floor(Math.random() * images.length)]
}

export function getOptimizedMeetupCoverImage(imageUrl?: string | null) {
  if (!imageUrl) return null
  if (!imageUrl.startsWith("/meetups/")) return imageUrl
  return imageUrl.replace(/\.(png|jpe?g)$/i, ".webp")
}
