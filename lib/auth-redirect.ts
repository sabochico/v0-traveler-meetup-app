export function getAuthRedirectUrl(next = "/") {
  if (typeof window === "undefined") return undefined

  const callbackUrl = new URL("/auth/callback", window.location.origin)
  callbackUrl.searchParams.set("next", next)
  return callbackUrl.toString()
}
