import Link from "next/link"
import { Mail, ArrowRight } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col film-grain">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-primary">drift</h1>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">Check your email</h2>
          <p className="text-muted-foreground mb-8">
            We sent you a confirmation link. Click it to activate your account and start drifting.
          </p>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            Back to login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">Find your people, anywhere in the world</p>
      </footer>
    </div>
  )
}
