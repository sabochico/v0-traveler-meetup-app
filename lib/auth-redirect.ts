import { Capacitor } from "@capacitor/core"

export const NATIVE_AUTH_CALLBACK_URL = "com.aweandco.drift://auth/callback"

export function isNativeRuntime() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform()
}

export function getAuthRedirectUrl(next = "/") {
  if (typeof window === "undefined") return undefined

  if (isNativeRuntime()) {
    const callbackUrl = new URL(NATIVE_AUTH_CALLBACK_URL)
    callbackUrl.searchParams.set("next", next)
    return callbackUrl.toString()
  }

  const callbackUrl = new URL("/auth/callback", window.location.origin)
  callbackUrl.searchParams.set("next", next)
  return callbackUrl.toString()
}
