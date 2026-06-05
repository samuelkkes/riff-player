import { MusicNotesIcon } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"

interface CoverArtProps {
  src?: string
  alt?: string
  className?: string
}

/** Album artwork thumbnail with a music-note fallback. */
export function CoverArt({ src, alt, className }: CoverArtProps) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex shrink-0 items-center justify-center overflow-hidden rounded-md",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} className="size-full object-cover" />
      ) : (
        <MusicNotesIcon className="size-1/2" />
      )}
    </div>
  )
}
