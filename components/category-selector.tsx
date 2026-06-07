"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface CategorySelectorOption {
  id: string
  label: string
  icon?: ReactNode
}

interface CategorySelectorProps {
  value: string
  options: CategorySelectorOption[]
  onChange: (value: string) => void
  ariaLabel: string
  storageKey?: string
  className?: string
  fullWidthItems?: boolean
}

const bubbleTransition = {
  type: "spring",
  stiffness: 460,
  damping: 36,
  mass: 0.78,
} as const

export function CategorySelector({
  value,
  options,
  onChange,
  ariaLabel,
  storageKey,
  className,
  fullWidthItems = false,
}: CategorySelectorProps) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!storageKey) return
    const storedValue = window.sessionStorage.getItem(storageKey)
    if (storedValue && storedValue !== value && options.some((option) => option.id === storedValue)) {
      onChange(storedValue)
    }
  }, [onChange, options, storageKey, value])

  useEffect(() => {
    if (!storageKey || !options.some((option) => option.id === value)) return
    window.sessionStorage.setItem(storageKey, value)
  }, [options, storageKey, value])

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex touch-pan-x gap-1.5 overflow-x-auto overscroll-x-contain rounded-[1.8rem] border border-white/[0.12] bg-[#10131a]/58 p-1.5 shadow-[0_12px_34px_rgb(0_0_0_/_0.22),inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        fullWidthItems && "w-full",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.id

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[1.4rem] px-4 text-sm font-semibold tracking-[0.01em] transition-colors duration-150",
              fullWidthItems && "min-w-0 flex-1",
              isActive ? "text-white" : "text-white/67 hover:text-white/88"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`category-selector-bubble-${storageKey ?? ariaLabel}`}
                className="absolute inset-0 rounded-[1.4rem] border border-white/[0.16] bg-white/[0.14] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.18),0_10px_26px_rgb(37_99_255_/_0.16)]"
                transition={prefersReducedMotion ? { duration: 0.01 } : bubbleTransition}
              />
            )}
            {option.icon && (
              <span className={cn("relative z-10 flex h-4 w-4 items-center justify-center", isActive ? "text-[var(--drift-teal)]" : "text-white/58")}>
                {option.icon}
              </span>
            )}
            <span className="relative z-10 whitespace-nowrap">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
