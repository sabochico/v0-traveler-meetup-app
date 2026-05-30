"use client"

import Link from "next/link"
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col film-grain overflow-x-hidden">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-primary">drift</h1>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>

          <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-8">
            We couldn&apos;t complete the authentication process. This could be due to an expired link or a temporary issue.
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/sign-up"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:glow-amber transition-all"
            >
              Try signing up again
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Need help?{" "}
          <a href="mailto:support@drift.app" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </footer>
    </div>
  )
}
