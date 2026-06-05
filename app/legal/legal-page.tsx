"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

interface LegalPageProps {
  title: string
  updatedAt: string
  children: ReactNode
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    sessionStorage.setItem("drift-open-tab", "profile")
    router.replace("/")
  }

  return (
    <main className="min-h-dvh bg-background text-foreground film-grain">
      <div className="mx-auto max-w-2xl px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(var(--drift-safe-top)+0.75rem)]">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 flex min-h-11 items-center gap-1 rounded-full pr-4 text-sm font-medium text-foreground transition-colors active:scale-95"
          aria-label="Go back"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </span>
          Back
        </button>

        <header className="space-y-3 border-b border-border/50 pb-5">
          <p className="text-sm font-medium text-muted-foreground">Last updated: {updatedAt}</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
        </header>

        <section className="mt-7 space-y-5 text-base leading-8 text-muted-foreground">
          {children}
        </section>
      </div>
    </main>
  )
}
