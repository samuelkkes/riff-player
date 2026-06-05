"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import {
  paletteFromSource,
  sourceColorFromImageUrl,
  type DerivedPalette,
  type SchemeVariant,
} from "@/lib/color-from-image"
import { usePlayer } from "@/lib/player-context"

interface DynamicColorValue {
  /** Whether album-art-derived theming is turned on. */
  enabled: boolean
  setEnabled: (value: boolean) => void
  /** Material 3 scheme variant used to derive colors. */
  variant: SchemeVariant
  setVariant: (value: SchemeVariant) => void
  /** Extra contrast/punch for the scheme (0..1). */
  contrast: number
  setContrast: (value: number) => void
  /** Hex source color currently applied, or null when using the default theme. */
  sourceColor: string | null
}

const DynamicColorContext = React.createContext<DynamicColorValue | null>(null)

// CSS variables we override on :root. Removing them reverts to the stylesheet
// defaults (including the .dark variants).
const MANAGED_VARS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
  "--ring",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
] as const

function applyPalette(p: DerivedPalette) {
  const root = document.documentElement.style
  root.setProperty("--background", p.background)
  root.setProperty("--foreground", p.foreground)
  root.setProperty("--card", p.card)
  root.setProperty("--card-foreground", p.cardForeground)
  root.setProperty("--popover", p.popover)
  root.setProperty("--popover-foreground", p.popoverForeground)
  root.setProperty("--primary", p.primary)
  root.setProperty("--primary-foreground", p.primaryForeground)
  root.setProperty("--secondary", p.secondary)
  root.setProperty("--secondary-foreground", p.secondaryForeground)
  root.setProperty("--muted", p.muted)
  root.setProperty("--muted-foreground", p.mutedForeground)
  root.setProperty("--accent", p.accent)
  root.setProperty("--accent-foreground", p.accentForeground)
  root.setProperty("--border", p.border)
  root.setProperty("--input", p.input)
  root.setProperty("--ring", p.ring)
  // Sidebar tokens (mirrored so any sidebar surfaces stay cohesive).
  root.setProperty("--sidebar", p.card)
  root.setProperty("--sidebar-foreground", p.cardForeground)
  root.setProperty("--sidebar-primary", p.primary)
  root.setProperty("--sidebar-primary-foreground", p.primaryForeground)
  root.setProperty("--sidebar-accent", p.accent)
  root.setProperty("--sidebar-accent-foreground", p.accentForeground)
  root.setProperty("--sidebar-border", p.border)
  root.setProperty("--sidebar-ring", p.ring)
}

function clearPalette() {
  const root = document.documentElement.style
  for (const v of MANAGED_VARS) root.removeProperty(v)
}

export function DynamicColorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentTrack } = usePlayer()
  const { resolvedTheme } = useTheme()
  const [enabled, setEnabled] = React.useState(true)
  const [variant, setVariant] = React.useState<SchemeVariant>("expressive")
  const [contrast, setContrast] = React.useState(0.2)
  const [sourceColor, setSourceColor] = React.useState<string | null>(null)

  const artwork = currentTrack?.artwork
  const isDark = resolvedTheme === "dark"

  React.useEffect(() => {
    let cancelled = false

    const reset = () => {
      clearPalette()
      setSourceColor(null)
    }

    if (!enabled || !artwork) {
      reset()
      return
    }

    sourceColorFromImageUrl(artwork)
      .then((source) => {
        if (cancelled) return
        const palette = paletteFromSource(source, isDark, contrast, variant)
        applyPalette(palette)
        setSourceColor(palette.source)
      })
      .catch(() => {
        if (!cancelled) reset()
      })

    return () => {
      cancelled = true
    }
  }, [enabled, artwork, isDark, contrast, variant])

  // Always clean up overrides when the provider unmounts.
  React.useEffect(() => () => clearPalette(), [])

  const value: DynamicColorValue = {
    enabled,
    setEnabled,
    variant,
    setVariant,
    contrast,
    setContrast,
    sourceColor,
  }

  return (
    <DynamicColorContext.Provider value={value}>
      {children}
    </DynamicColorContext.Provider>
  )
}

export function useDynamicColor(): DynamicColorValue {
  const ctx = React.useContext(DynamicColorContext)
  if (!ctx) {
    throw new Error("useDynamicColor must be used within a DynamicColorProvider")
  }
  return ctx
}
