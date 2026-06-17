import { Capacitor } from "@capacitor/core"

export const NATIVE_AUTH_CALLBACK_URL = "drift://auth/callback"
const PRODUCTION_ORIGIN = "https://driftapp.me"

export function isNativeRuntime() {
  if (typeof window === "undefined") return false

  return Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "web"
}

export function getAuthRedirectUrl(next = "/") {
  if (typeof window === "undefined") return undefined

  if (isNativeRuntime()) {
    const callbackUrl = new URL(NATIVE_AUTH_CALLBACK_URL)
    callbackUrl.searchParams.set("next", next)
    return callbackUrl.toString()
  }

  const origin = window.location.origin.startsWith("http") ? window.location.origin : PRODUCTION_ORIGIN
  const callbackUrl = new URL("/auth/callback", origin)
  callbackUrl.searchParams.set("next", next)

  return callbackUrl.toString()
}
