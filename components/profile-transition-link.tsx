"use client"

import type { MouseEvent, ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { triggerLightImpact } from "@/lib/haptics"

interface ProfileTransitionLinkProps {
  href: string
  className?: string
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  "aria-label"?: string
}

export function ProfileTransitionLink({ href, onClick, children, ...props }: ProfileTransitionLinkProps) {
  const prefersReducedMotion = useReducedMotion()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || String(href) === "#") return
    triggerLightImpact()
  }

  return (
    <Link href={href} legacyBehavior passHref>
      <motion.a
        {...props}
        onClick={handleClick}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
        transition={prefersReducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 520, damping: 36, mass: 0.5 }}
      >
        {children}
      </motion.a>
    </Link>
  )
}
