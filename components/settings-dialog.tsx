"use client"

import { GearSixIcon } from "@phosphor-icons/react/dist/ssr"

import type { SchemeVariant } from "@/lib/color-from-image"
import { useDynamicColor } from "@/lib/dynamic-color-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

const VARIANTS: { value: SchemeVariant; label: string }[] = [
  { value: "fidelity", label: "Fidelity (album-true)" },
  { value: "content", label: "Content" },
  { value: "vibrant", label: "Vibrant" },
  { value: "expressive", label: "Expressive" },
  { value: "tonalSpot", label: "Tonal Spot" },
]

export function SettingsDialog() {
  const {
    enabled,
    setEnabled,
    variant,
    setVariant,
    contrast,
    setContrast,
    sourceColor,
  } = useDynamicColor()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <GearSixIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Personalize how Riff looks while you listen.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="dynamic-color">Dynamic color</FieldLabel>
              <FieldDescription>
                Theme the UI from the album art (Material 3).
              </FieldDescription>
            </FieldContent>
            <Switch
              id="dynamic-color"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </Field>

          <Field data-disabled={!enabled || undefined}>
            <FieldLabel htmlFor="scheme-style">Style</FieldLabel>
            <Select
              value={variant}
              onValueChange={(v) => setVariant(v as SchemeVariant)}
              disabled={!enabled}
            >
              <SelectTrigger id="scheme-style" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {VARIANTS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              How boldly colors are derived — Fidelity stays true to the cover,
              Expressive shifts hues for a playful palette.
            </FieldDescription>
          </Field>

          <Field data-disabled={!enabled || undefined}>
            <FieldLabel htmlFor="expressiveness">Expressiveness</FieldLabel>
            <Slider
              id="expressiveness"
              value={[contrast]}
              min={0}
              max={1}
              step={0.05}
              disabled={!enabled}
              onValueChange={([v]) => setContrast(v)}
              aria-label="Expressiveness"
            />
            <FieldDescription>
              Extra contrast and punch in the derived palette.
            </FieldDescription>
          </Field>

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Source color</FieldLabel>
              <FieldDescription>
                {sourceColor
                  ? `Sampled from the current track.`
                  : "Using the default theme."}
              </FieldDescription>
            </FieldContent>
            <div className="flex items-center gap-2">
              <span
                className="border-border size-6 rounded-full border"
                style={{ backgroundColor: sourceColor ?? "transparent" }}
              />
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {sourceColor ?? "—"}
              </span>
            </div>
          </Field>
        </FieldGroup>

        <div className="border-border/60 mt-2 flex items-center gap-3 border-t pt-4">
          <img
            src="https://github.com/samuelkkes.png"
            alt="Samuel Eli Kougbam"
            width={32}
            height={32}
            className="border-border size-8 rounded-full border"
          />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Created by</span>
            <a
              href="https://github.com/samuelkkes"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium hover:underline"
            >
              Samuel Eli Kougbam
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
