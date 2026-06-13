export const MODERATION_BLOCK_MESSAGE =
  "Your text contains language that goes against Drift's community guidelines. Please edit it and try again."

type ModerationContext = "message" | "profile" | "meetup" | "report"

export class ModerationError extends Error {
  code = "TEXT_MODERATION_BLOCKED"

  constructor(message = MODERATION_BLOCK_MESSAGE) {
    super(message)
    this.name = "ModerationError"
  }
}

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
  "8": "b",
}

const BLOCKED_TERMS = [
  "nigger",
  "nigga",
  "chink",
  "gook",
  "spic",
  "wetback",
  "kike",
  "raghead",
  "faggot",
  "tranny",
  "shemale",
  "retard",
]

const BLOCKED_PHRASES = [
  "kill yourself",
  "go kill yourself",
  "go die",
  "i will kill you",
  "im going to kill you",
  "i am going to kill you",
  "rape you",
  "heil hitler",
  "white power",
  "join isis",
]

function normalizeForModeration(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[0134@5$7+8!]/g, (char) => LEET_MAP[char] ?? char)

  const spaced = normalized
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(.)\1{2,}/g, "$1")

  const compact = spaced.replace(/\s+/g, "")

  return { spaced, compact }
}

export function cleanUserText(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim()
}

export function checkTextModeration(value: string | null | undefined, _context: ModerationContext) {
  const text = cleanUserText(value ?? "")
  if (!text) return { ok: true as const }

  const { spaced, compact } = normalizeForModeration(text)
  const containsBlockedTerm = BLOCKED_TERMS.some((term) => {
    const normalizedTerm = normalizeForModeration(term)
    return new RegExp(`(^|\\s)${normalizedTerm.spaced}(\\s|$)`).test(spaced) || compact.includes(normalizedTerm.compact)
  })

  const containsBlockedPhrase = BLOCKED_PHRASES.some((phrase) => {
    const normalizedPhrase = normalizeForModeration(phrase)
    return spaced.includes(normalizedPhrase.spaced) || compact.includes(normalizedPhrase.compact)
  })

  if (containsBlockedTerm || containsBlockedPhrase) {
    return { ok: false as const, message: MODERATION_BLOCK_MESSAGE }
  }

  return { ok: true as const }
}

export function assertTextIsSafe(value: string | null | undefined, context: ModerationContext) {
  const result = checkTextModeration(value, context)
  if (!result.ok) throw new ModerationError(result.message)
}

export function assertFieldsAreSafe(
  fields: Array<string | null | undefined>,
  context: ModerationContext
) {
  for (const field of fields) {
    assertTextIsSafe(field, context)
  }
}
