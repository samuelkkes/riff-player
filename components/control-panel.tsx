"use client"

import * as React from "react"
import { Pane } from "tweakpane"

import type { SchemeVariant } from "@/lib/color-from-image"
import { useDynamicColor } from "@/lib/dynamic-color-context"

const NO_COLOR = "#808080"

const VARIANT_OPTIONS: Record<string, SchemeVariant> = {
  "Fidelity (album-true)": "fidelity",
  Content: "content",
  Vibrant: "vibrant",
  Expressive: "expressive",
  "Tonal Spot": "tonalSpot",
}

export function ControlPanel() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const paneRef = React.useRef<Pane | null>(null)
  const paramsRef = React.useRef({
    dynamicColor: true,
    variant: "expressive" as SchemeVariant,
    contrast: 0.2,
    source: NO_COLOR,
  })

  const {
    enabled,
    setEnabled,
    variant,
    setVariant,
    contrast,
    setContrast,
    sourceColor,
  } = useDynamicColor()

  // Keep the latest setters in refs so the pane can be created once.
  const setEnabledRef = React.useRef(setEnabled)
  const setVariantRef = React.useRef(setVariant)
  const setContrastRef = React.useRef(setContrast)
  React.useEffect(() => {
    setEnabledRef.current = setEnabled
    setVariantRef.current = setVariant
    setContrastRef.current = setContrast
  })

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const pane = new Pane({ container, title: "Appearance" })
    paneRef.current = pane

    pane
      .addBinding(paramsRef.current, "dynamicColor", { label: "Album color" })
      .on("change", (ev) => setEnabledRef.current(ev.value))

    pane
      .addBinding(paramsRef.current, "variant", {
        label: "Style",
        options: VARIANT_OPTIONS,
      })
      .on("change", (ev) => setVariantRef.current(ev.value as SchemeVariant))

    pane
      .addBinding(paramsRef.current, "contrast", {
        label: "Expressiveness",
        min: 0,
        max: 1,
        step: 0.05,
      })
      .on("change", (ev) => setContrastRef.current(ev.value))

    pane.addBinding(paramsRef.current, "source", {
      label: "Source",
      readonly: true,
      view: "color",
    })

    return () => {
      pane.dispose()
      paneRef.current = null
    }
  }, [])

  // Reflect external state changes back into the pane.
  React.useEffect(() => {
    paramsRef.current.dynamicColor = enabled
    paramsRef.current.variant = variant
    paramsRef.current.contrast = contrast
    paramsRef.current.source = sourceColor ?? NO_COLOR
    paneRef.current?.refresh()
  }, [enabled, variant, contrast, sourceColor])

  return (
    <div
      ref={containerRef}
      className="fixed top-16 right-3 z-40 w-56 [&_.tp-dfwv]:!w-full"
    />
  )
}
