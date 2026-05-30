"use client"

import { cn } from "@/lib/utils"

interface DriftLogoProps {
  className?: string
  markClassName?: string
  showWordmark?: boolean
  wordmarkClassName?: string
}

// Temporary Version E-inspired abstract D mark until final exported SVG assets are available.
export function DriftLogo({
  className,
  markClassName,
  showWordmark = false,
  wordmarkClassName,
}: DriftLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className={cn("h-8 w-8 shrink-0", markClassName)}
      >
        <defs>
          <linearGradient id="drift-logo-gradient" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563FF" />
            <stop offset="1" stopColor="#00D4CC" />
          </linearGradient>
        </defs>
        <path
          fill="url(#drift-logo-gradient)"
          d="M16 11h18c9.9 0 18 7.8 18 17.5 0 2.2-1.9 3.9-4.1 3.6-8.6-1.3-15.2-4-20.2-8.4-1.7-1.5-3.8-2.3-6.1-2.3H16a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4Z"
        />
        <path
          fill="url(#drift-logo-gradient)"
          d="M16 34.3h5.3c2.4 0 4.7.8 6.5 2.4 5 4.3 11.6 7 20 8.2 2.3.3 4.2 2.1 4.2 4.4C52 58.1 44.1 64 34.7 64H16a4 4 0 0 1-4-4V38.3a4 4 0 0 1 4-4Z"
          transform="translate(0 -10)"
        />
      </svg>
      {showWordmark && (
        <span className={cn("text-2xl font-semibold tracking-tight text-foreground", wordmarkClassName)}>
          Drift
        </span>
      )}
    </div>
  )
}
