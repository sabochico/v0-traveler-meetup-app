"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { SocialAuthButtons } from "@/components/social-auth-buttons"
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import type { Session } from "@supabase/supabase-js"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const focusEmailLogin = () => {
    const input = document.getElementById("login-email")
    input?.scrollIntoView({ behavior: "smooth", block: "center" })
    input?.focus()
  }

  const isTransientAuthError = (value: unknown) => {
    const message = value instanceof Error ? value.message : String(value ?? "")
    return /failed to fetch|network|fetch/i.test(message)
  }

  const formatAuthError = (value: unknown) => {
    if (isTransientAuthError(value)) {
      return "We had trouble connecting. Please try again."
    }

    return value instanceof Error ? value.message : String(value)
  }

  useEffect(() => {
    if (sessionStorage.getItem("drift_account_deleted") !== "true") return
    sessionStorage.removeItem("drift_account_deleted")
    setSuccess("Your account has been deleted.")
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const signIn = () => supabase.auth.signInWithPassword({ email, password })

    let authError: unknown = null
    let authSession: Session | null = null

    try {
      let result = await signIn()
      if (result.error && isTransientAuthError(result.error)) {
        result = await signIn()
      }
      authError = result.error
      authSession = result.data.session
    } catch (error) {
      if (isTransientAuthError(error)) {
        try {
          const retryResult = await signIn()
          authError = retryResult.error
          authSession = retryResult.data.session
        } catch (retryError) {
          authError = retryError
        }
      } else {
        authError = error
      }
    }

    if (authError) {
      setError(formatAuthError(authError))
      setLoading(false)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!authSession && !session) {
      setError("We could not keep you signed in. Please try again.")
      setLoading(false)
      return
    }

    router.replace("/")
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col film-grain overflow-x-hidden">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-primary">drift</h1>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to find your next coffee buddy</p>
          </div>

          <SocialAuthButtons emailLabel="Log in with email" onEmailClick={focusEmailLogin} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/70" />
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-0 pl-10 text-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-0 pl-10 pr-10 text-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:glow-amber transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New to drift?{" "}
            <Link href="/auth/sign-up" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">Find your people, anywhere in the world</p>
      </footer>
    </div>
  )
}
