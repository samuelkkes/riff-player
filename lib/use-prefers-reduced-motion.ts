"use client"

import * as React from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Reliable `prefers-reduced-motion` detection via `matchMedia`.
 *
 * Defaults to `false` for SSR and the first paint, then reflects the real OS
 * setting after mount and stays in sync with live changes. We use this instead
 * of motion's built-in `useReducedMotion`, which was returning a stale/incorrect
 * value in some browsers (freezing animations even when motion was allowed).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const update = () => setReduced(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  return reduced
}
