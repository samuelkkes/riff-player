"use client"

import { MotionConfig } from "motion/react"

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion"

/**
 * Honors the user's `prefers-reduced-motion` setting. We detect the preference
 * ourselves (motion's built-in detection was unreliable here) and feed it to
 * `MotionConfig` as an explicit "always"/"never", so transform and layout
 * animations are disabled only when the OS actually asks for reduced motion.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion()
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      {children}
    </MotionConfig>
  )
}
