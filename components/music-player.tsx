"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  FolderOpenIcon,
  MicrophoneStageIcon,
  MusicNotesIcon,
  SpinnerGapIcon,
  TrashIcon,
  WaveformIcon,
} from "@phosphor-icons/react/dist/ssr"

import { usePlayer } from "@/lib/player-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LyricsDrawer } from "@/components/lyrics-drawer"
import { PlayerBar } from "@/components/player-bar"
import { SettingsDialog } from "@/components/settings-dialog"
import { TrackList } from "@/components/track-list"

export function MusicPlayer() {
  const { tracks, loadingCount, addFiles, clear } = usePlayer()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [showLyrics, setShowLyrics] = React.useState(false)
  const dragDepth = React.useRef(0)

  const openPicker = () => inputRef.current?.click()

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files)
  }

  return (
    <div
      className="bg-background flex h-svh flex-col"
      onDragEnter={(e) => {
        e.preventDefault()
        dragDepth.current += 1
        setDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault()
        dragDepth.current -= 1
        if (dragDepth.current <= 0) setDragging(false)
      }}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <WaveformIcon className="size-5" weight="fill" />
          </div>
          <div>
            <h1 className="font-heading text-lg leading-none font-semibold">
              Riff
            </h1>
            <p className="text-muted-foreground text-xs">
              {tracks.length > 0
                ? `${tracks.length} track${tracks.length > 1 ? "s" : ""}${
                    loadingCount > 0 ? " · reading tags…" : ""
                  }`
                : "Local music player"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tracks.length > 0 && (
            <>
              <Button
                variant={showLyrics ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowLyrics((v) => !v)}
                aria-pressed={showLyrics}
                className={cn(showLyrics && "text-primary")}
              >
                <MicrophoneStageIcon data-icon="inline-start" />
                Lyrics
              </Button>
              <Button variant="ghost" size="sm" onClick={clear}>
                <TrashIcon data-icon="inline-start" />
                Clear
              </Button>
            </>
          )}
          <Button size="sm" onClick={openPicker}>
            <FolderOpenIcon data-icon="inline-start" />
            Add music
          </Button>
          <SettingsDialog />
        </div>
      </header>

      {/* Library */}
      <div className="relative min-h-0 flex-1">
        {tracks.length === 0 ? (
          <Empty className="h-full">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <motion.span
                    initial={{ scale: 0.6, rotate: -8 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 14,
                      delay: 0.1,
                    }}
                    className="flex"
                  >
                    <MusicNotesIcon />
                  </motion.span>
                </EmptyMedia>
                <EmptyTitle>Your library is empty</EmptyTitle>
                <EmptyDescription>
                  Add audio files from your computer to start listening. Nothing
                  is uploaded — everything plays locally in your browser.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={openPicker}>
                  <FolderOpenIcon data-icon="inline-start" />
                  Add music
                </Button>
                <p className="text-muted-foreground text-xs">
                  or drag &amp; drop files anywhere
                </p>
              </EmptyContent>
            </motion.div>
          </Empty>
        ) : (
          <ScrollArea className="h-full">
            <TrackList />
          </ScrollArea>
        )}

        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="bg-background/80 border-primary pointer-events-none absolute inset-3 z-10 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed backdrop-blur-sm"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <FolderOpenIcon className="text-primary size-10" weight="fill" />
              </motion.div>
              <p className="text-lg font-medium">Drop to add to your library</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loadingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-card text-muted-foreground absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm"
            >
              <SpinnerGapIcon className="size-4 animate-spin motion-reduce:animate-none" />
              Reading {loadingCount} file{loadingCount > 1 ? "s" : ""}…
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PlayerBar />

      <LyricsDrawer open={showLyrics} onOpenChange={setShowLyrics} />
    </div>
  )
}
