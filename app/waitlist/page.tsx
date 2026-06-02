"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Loader2, MapPin } from "lucide-react"
import { DriftLogo } from "@/components/drift-logo"
import { detectCurrentLocation, type DetectedLocation } from "@/lib/location"
import { getLaunchCityEligibility, LAUNCH_CITIES } from "@/lib/launch-cities"

export default function WaitlistPage() {
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    detectCurrentLocation()
      .then((location) => {
        setDetectedLocation(location)
        setCity(location.city)
      })
      .catch(() => {})
  }, [])

  const eligibility = useMemo(
    () =>
      getLaunchCityEligibility(
        detectedLocation ?? (city ? { city, country: null, latitude: null, longitude: null } : null)
      ),
    [city, detectedLocation]
  )
  const nearestLaunchCity = eligibility.nearestCity?.launchCity

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          city: detectedLocation?.city ?? city,
          country: detectedLocation?.country ?? null,
          nearestLaunchCity: nearestLaunchCity
            ? `${nearestLaunchCity.city}, ${nearestLaunchCity.country}`
            : null,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) throw new Error(data.error ?? "Could not join waitlist.")
      setSuccess(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not join waitlist.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-background film-grain px-5 py-[calc(1.25rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem-env(safe-area-inset-top))] max-w-md flex-col">
        <header className="flex items-center justify-between">
          <DriftLogo markClassName="h-9 w-9" />
          <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/80 p-5 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="absolute inset-x-0 top-0 h-1 drift-gradient" />
            <div className="mb-5 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Limited city launch
            </div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
              Drift is opening city by city.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Drift is currently live in Tokyo, Melbourne, Los Angeles, and Singapore.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We&apos;re opening new cities soon. Join the waitlist and we&apos;ll let you know when Drift launches near you.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-secondary/60 p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  {detectedLocation
                    ? `Detected: ${detectedLocation.city}, ${detectedLocation.country}`
                    : "Location not confirmed yet"}
                </span>
              </div>
              {nearestLaunchCity && (
                <p className="text-muted-foreground">
                  Nearest launch city:{" "}
                  <span className="font-medium text-foreground">
                    {nearestLaunchCity.city}, {nearestLaunchCity.country}
                  </span>
                </p>
              )}
            </div>

            {success ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">You&apos;re on the waitlist.</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;ll email you when Drift launches near you.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="min-h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name (optional)"
                  className="min-h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City (optional)"
                  className="min-h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join waitlist"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {LAUNCH_CITIES.map((launchCity) => (
              <span key={launchCity.city} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                {launchCity.city}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
