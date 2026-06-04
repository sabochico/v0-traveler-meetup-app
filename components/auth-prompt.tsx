import Link from "next/link"
import { LogIn, ArrowRight } from "lucide-react"

interface AuthPromptProps {
  message: string
}

export function AuthPrompt({ message }: AuthPromptProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[var(--drift-safe-top)]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-primary">drift</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-xl font-serif font-semibold text-foreground mb-2">{message}</h2>
          <p className="text-muted-foreground mb-8">
            Join drift to connect with travelers and locals in your area
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/sign-up"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:glow-amber transition-all"
            >
              Create an account
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
