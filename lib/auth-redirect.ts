import { Capacitor } from "@capacitor/core"

export const NATIVE_AUTH_CALLBACK_URL = "com.aweandco.drift://auth/callback"
const PRODUCTION_ORIGIN = "https://driftapp.me"

export function isNativeRuntime() {
  if (typeof window === "undefined") return false

  return Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "web"
}

export function getAuthRedirectUrl(next = "/") {
  if (typeof window === "undefined") return undefined

  if (isNativeRuntime()) {
    return NATIVE_AUTH_CALLBACK_URL
  }

  const callbackUrl = new URL("/auth/callback", PRODUCTION_ORIGIN)
  callbackUrl.searchParams.set("next", next)

  return callbackUrl.toString()
}
