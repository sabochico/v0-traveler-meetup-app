import Link from "next/link"
import { ArrowRight, HeartHandshake, Mail } from "lucide-react"
import { DriftLogo } from "@/components/drift-logo"

const SUPPORT_TOPICS = [
  "Account issues",
  "Meetup creation problems",
  "Messaging issues",
  "Reporting and blocking users",
  "Privacy and safety concerns",
  "Feature requests",
]

export default function SupportPage() {
  return (
    <main className="min-h-dvh bg-background px-5 py-[calc(1.5rem+env(safe-area-inset-top))] text-foreground film-grain">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem-env(safe-area-inset-top))] max-w-md flex-col">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Drift home">
            <DriftLogo markClassName="h-9 w-9" />
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Support
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-8">
          <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HeartHandshake className="h-6 w-6" />
            </div>

            <h1 className="text-3xl font-serif font-semibold tracking-tight">Need Help?</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              If you&apos;re experiencing issues with Drift or have questions, we&apos;re here to help.
            </p>

            <div className="mt-5 rounded-2xl bg-secondary/70 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Contact</p>
              <a
                href="mailto:aweandco@gmail.com"
                className="mt-2 flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-primary"
              >
                <Mail className="h-4 w-4" />
                aweandco@gmail.com
              </a>
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold">Common Support Topics</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {SUPPORT_TOPICS.map((topic) => (
                  <li key={topic} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <p className="text-xs font-medium uppercase text-primary">Response Time</p>
              <p className="mt-1 text-sm text-foreground">We aim to respond within 48 hours.</p>
            </div>

            <div className="mt-5 grid gap-2">
              <a
                href="mailto:aweandco@gmail.com"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
              >
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </a>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Link className="flex min-h-11 items-center justify-center rounded-xl bg-secondary px-3 text-sm font-medium" href="/legal/privacy">
                  Privacy Policy
                </Link>
                <Link className="flex min-h-11 items-center justify-center rounded-xl bg-secondary px-3 text-sm font-medium" href="/legal/terms">
                  Terms of Service
                </Link>
                <Link className="flex min-h-11 items-center justify-center rounded-xl bg-secondary px-3 text-sm font-medium" href="/legal/community">
                  Community Guidelines
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-[env(safe-area-inset-bottom)] text-center text-xs text-muted-foreground">
          © Drift. All rights reserved.
        </footer>
      </div>
    </main>
  )
}
