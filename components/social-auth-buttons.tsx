"use client"

import { useState } from "react"
import type React from "react"
import { Loader2, Mail } from "lucide-react"
import type { Provider } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getAuthRedirectUrl } from "@/lib/auth-redirect"
import { cn } from "@/lib/utils"

type SocialProvider = Extract<Provider, "google" | "apple" | "facebook">

const PROVIDERS: Array<{
  id: SocialProvider
  label: string
  icon: React.ReactNode
}> = [
  {
    id: "google",
    label: "Continue with Google",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.51c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H3.08v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.42 13.88a6 6 0 0 1 0-3.76v-2.6H3.08a10 10 0 0 0 0 8.96l3.34-2.6Z" />
        <path fill="#EA4335" d="M12 6c1.47 0 2.8.5 3.84 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.52l3.34 2.6C7.2 7.76 9.4 6 12 6Z" />
      </svg>
    ),
  },
  { id: "apple", label: "Continue with Apple", icon: <span className="text-xl leading-none"></span> },
  { id: "facebook", label: "Continue with Facebook", icon: <span className="text-lg font-bold text-[#1877F2]">f</span> },
]

interface SocialAuthButtonsProps {
  emailLabel: string
  onEmailClick: () => void
}

export function SocialAuthButtons({ emailLabel, onEmailClick }: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuth = async (provider: SocialProvider) => {
    if (loadingProvider) return

    setLoadingProvider(provider)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl("/"),
        },
      })

      if (error) throw error
    } catch (error) {
      setLoadingProvider(null)
      setError(error instanceof Error ? error.message : "Could not start social login. Please try again.")
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleOAuth(provider.id)}
            disabled={Boolean(loadingProvider)}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-foreground shadow-sm shadow-black/10 transition-all active:scale-[0.99] hover:border-primary/30 hover:bg-white/[0.09] disabled:opacity-60"
          >
            {loadingProvider === provider.id ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : provider.icon}
            {provider.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onEmailClick}
          disabled={Boolean(loadingProvider)}
          className={cn(
            "flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-60",
            "drift-gradient-button text-primary-foreground shadow-lg shadow-primary/20"
          )}
        >
          <Mail className="h-5 w-5" />
          {emailLabel}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
