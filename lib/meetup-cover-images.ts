const MEETUP_COVER_IMAGES: Record<string, string[]> = {
  coffee: [
    "/meetups/coffee/coffee 1.jpeg",
    "/meetups/coffee/coffee 2.jpeg",
    "/meetups/coffee/coffee 3.jpeg",
    "/meetups/coffee/coffee 4.png",
  ],
  food: [
    "/meetups/food adventure/food 1.png",
    "/meetups/food adventure/food 2.png",
    "/meetups/food adventure/food 3.png",
    "/meetups/food adventure/food 4.png",
    "/meetups/food adventure/food 5.png",
  ],
  photo: [
    "/meetups/photography/photo 1.png",
    "/meetups/photography/photo 2.png",
    "/meetups/photography/photo 3.png",
    "/meetups/photography/photo 4.png",
    "/meetups/photography/photo 5.png",
  ],
  walk: [
    "/meetups/night walk/night walk 1.png",
    "/meetups/night walk/night walk 2.png",
    "/meetups/night walk/night walk 3.png",
    "/meetups/night walk/night walk 4.png",
    "/meetups/night walk/night walk 5.png",
  ],
  study: [
    "/meetups/study session/study 1.png",
    "/meetups/study session/study 2.png",
    "/meetups/study session/study 3.png",
    "/meetups/study session/study 4.png",
  ],
  gaming: [
    "/meetups/gaming/gaming 1.png",
    "/meetups/gaming/gaming 2.png",
    "/meetups/gaming/gaming 3.png",
    "/meetups/gaming/gaming 4.png",
    "/meetups/gaming/gaming 5.png",
  ],
  explore: [
    "/meetups/exploring/exploring 1.png",
    "/meetups/exploring/exploring 2.png",
    "/meetups/exploring/exploring 3.png",
    "/meetups/exploring/explring 4.png",
  ],
}

function hash(value: string) {
  let result = 0
  for (let i = 0; i < value.length; i += 1) {
    result = (result * 31 + value.charCodeAt(i)) >>> 0
  }
  return result
}

export function getMeetupCoverImage(category: string, seed: string) {
  const images = MEETUP_COVER_IMAGES[category] ?? []
  if (images.length === 0) return null
  return images[hash(seed) % images.length]
}

export function getRandomMeetupCoverImage(category: string) {
  const images = MEETUP_COVER_IMAGES[category] ?? []
  if (images.length === 0) return null
  return images[Math.floor(Math.random() * images.length)]
}
