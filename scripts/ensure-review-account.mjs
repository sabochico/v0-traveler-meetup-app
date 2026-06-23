import { existsSync, readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const REVIEW_EMAIL = "review@driftapp.me"
const REVIEW_PASSWORD = "DriftReview2026!"

function loadLocalEnv() {
  if (!existsSync(".env.local")) return

  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue

    const separatorIndex = trimmed.indexOf("=")
    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "")

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadLocalEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function findUserByEmail(email) {
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase())
    if (user) return user
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function ensureReviewAccount() {
  let user = await findUserByEmail(REVIEW_EMAIL)
  let createdUser = false

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: REVIEW_EMAIL,
      password: REVIEW_PASSWORD,
      email_confirm: true,
      user_metadata: {
        display_name: "Drift Review",
      },
    })

    if (error) throw error
    user = data.user
    createdUser = true
  }

  if (!user?.id) throw new Error("Could not resolve review user id.")

  const now = new Date().toISOString()
  const reviewProfile = {
    id: user.id,
    display_name: "Drift Review",
    bio: "Apple App Review Test Account",
    avatar_url: "/drift-logo-splash-512.png",
    profile_photos: ["/drift-logo-splash-512.png", "/apple-icon.png"],
    interests: ["Coffee", "Exploring", "Food"],
    languages: ["English"],
    mood: "exploring",
    travel_mode: true,
    anonymous_mode: false,
    current_city: "Tokyo",
    current_country: "Japan",
    last_active_at: now,
    last_seen_at: now,
    updated_at: now,
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(reviewProfile, { onConflict: "id" })

  if (profileError) throw profileError

  console.log(createdUser ? "Created review account." : "Review account already existed; profile ensured.")
  console.log(`Email: ${REVIEW_EMAIL}`)
}

ensureReviewAccount().catch((error) => {
  console.error("Failed to ensure review account:", error.message ?? error)
  process.exit(1)
})
