export function normalizeLocationValue(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()
}

export function hasLocationValue(value: string | null | undefined) {
  return normalizeLocationValue(value).length > 0
}

export function sameCity(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeLocationValue(left)
  const normalizedRight = normalizeLocationValue(right)
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

export function sameCountry(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeLocationValue(left)
  const normalizedRight = normalizeLocationValue(right)
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

export function sameCityAndCountry(
  left: { city?: string | null; country?: string | null },
  right: { city?: string | null; country?: string | null }
) {
  if (!sameCity(left.city, right.city)) return false

  const leftCountry = normalizeLocationValue(left.country)
  const rightCountry = normalizeLocationValue(right.country)
  return !leftCountry || !rightCountry || leftCountry === rightCountry
}
