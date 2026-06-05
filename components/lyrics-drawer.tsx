"use client"

import { usePlayer } from "@/lib/player-context"
import { useIsMobile } from "@/lib/use-is-mobile"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CoverArt } from "@/components/cover-art"
import { LyricsView } from "@/components/lyrics-view"

export function LyricsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const { currentTrack } = usePlayer()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile
            ? "h-[88vh] rounded-t-2xl"
            : "w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl data-[side=right]:xl:max-w-3xl"
        )}
      >
        <SheetHeader className="flex-row items-center gap-3 border-b px-5 py-4">
          <CoverArt
            src={currentTrack?.artwork}
            alt={currentTrack?.album}
            className="size-11"
          />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-base">
              {currentTrack?.title ?? "Lyrics"}
            </SheetTitle>
            <SheetDescription className="truncate">
              {currentTrack?.artist ?? "Nothing playing"}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="no-scrollbar relative min-h-0 flex-1">
          <LyricsView />
        </div>
      </SheetContent>
    </Sheet>
  )
}
