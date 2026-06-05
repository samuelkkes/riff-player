# 🎵 Riff — Local Music Player

A fast, private, **fully local** music player that runs in your browser. Drop in your own audio files and Riff plays them instantly — no uploads, no accounts, no streaming. It reads embedded tags and artwork, recolors the entire UI from the album cover (Material 3 style), shows the track in your OS media controls, and displays **word-by-word synchronized lyrics**.

> Everything happens on your machine. Your files never leave the browser.

🔗 **Repo:** https://github.com/samuelkkes/riff-player

---

## ✨ Features

- **📁 Local playback** — add files via the picker or drag-and-drop anywhere. Supports MP3, FLAC, M4A/AAC, WAV, OGG/Opus, and more.
- **🏷️ Automatic metadata** — title, artist, album, duration, and embedded cover art are parsed from the files in the background.
- **▶️ Full transport** — play/pause, next/previous, seek, volume/mute, shuffle, and repeat (off / all / one).
- **🎨 Dynamic theming (Material 3)** — the UI recolors from the playing track's artwork using Google's Material Color Utilities. Pick a scheme (Fidelity, Content, Vibrant, Expressive, Tonal Spot) and dial the expressiveness — or turn it off to keep the default theme.
- **🎤 Synchronized lyrics** — word-by-word karaoke-style highlighting in a responsive drawer (right side on desktop, bottom sheet on mobile), with an Apple-Music-style **progressive blur** on the surrounding lines, tap-to-seek, and auto-scroll.
- **🖥️ OS media controls** — track title, artist, artwork, and a working scrubber appear in Chrome's media hub, the Windows/macOS media overlay, and the lock screen (via the Media Session API), including hardware media-key support.
- **💫 Polished motion** — staggered list animations, an animated equalizer on the now-playing track, and smooth transitions — all of which respect `prefers-reduced-motion`.
- **🌗 Light / dark mode** — system-aware, with a quick toggle (press <kbd>d</kbd>).
- **📱 Responsive** — works from phone to widescreen.

---

## 🧰 Tech Stack

| Area | Tool |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| UI components | [shadcn/ui](https://ui.shadcn.com) on [Radix UI](https://www.radix-ui.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) |
| Animation | [Motion](https://motion.dev) (formerly Framer Motion) |
| Icons | [Phosphor Icons](https://phosphoricons.com) |
| Tag parsing | [music-metadata](https://github.com/borewit/music-metadata) |
| Dynamic color | [@material/material-color-utilities](https://github.com/material-foundation/material-color-utilities) |
| Lyrics | [LyricsPlus / KPoe API](https://github.com/ibratabian17/lyricsplus) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| Toasts | [Sonner](https://sonner.emilkowal.ski) |
| Dev tweaking | [Tweakpane](https://tweakpane.github.io/docs/) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) (the project uses pnpm; npm/yarn/bun also work)

### Install & run

```bash
# clone
git clone https://github.com/samuelkkes/riff-player.git
cd riff-player

# install dependencies
pnpm install

# start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), then **Add music** (or drag files onto the window) and press play.

### Scripts

```bash
pnpm dev         # start the dev server
pnpm build       # production build
pnpm start       # run the production build
pnpm lint        # ESLint
pnpm typecheck   # TypeScript, no emit
pnpm format      # Prettier
```

---

## 🏗️ How It Works

- **Audio engine** ([`lib/player-context.tsx`](lib/player-context.tsx)) wraps a single `HTMLAudioElement` and exposes the playlist, transport, and live position. Object URLs are tracked and revoked to avoid leaks.
- **Metadata** is parsed client-side with `music-metadata` (`parseBlob`), including embedded artwork.
- **Dynamic color** ([`lib/color-from-image.ts`](lib/color-from-image.ts)) downsamples the cover to a canvas, extracts a source color with the MD3 quantize + score pipeline, builds a `DynamicScheme`, and writes the role colors onto CSS variables.
- **Lyrics** are fetched through a small server proxy ([`app/api/lyrics/route.ts`](app/api/lyrics/route.ts)) that queries the KPoe servers (avoiding CORS) and normalizes the word-timed result, which is then rendered with a `requestAnimationFrame`-driven highlight.
- **Media Session** metadata, playback state, position, and action handlers are wired up so OS-level controls work.

> ⚠️ **Lyrics matching** depends on accurate **title/artist tags** in your files. Well-tagged tracks get instant word-synced lyrics; poorly tagged ones may not match.

---

## 🔒 Privacy

Riff is local-first. Audio files are read in the browser and played via in-memory object URLs — **nothing is uploaded**. The only outbound request is an optional, anonymous lyrics lookup (title + artist) made through the app's own server route when you open the lyrics drawer.

---

## 🙏 Credits & Acknowledgements

Riff is built on the work of many open-source projects and APIs. Huge thanks to:

- **[shadcn/ui](https://ui.shadcn.com)** & **[Radix UI](https://www.radix-ui.com)** — the component foundation.
- **[Next.js](https://nextjs.org)** & **[React](https://react.dev)** — the framework.
- **[Tailwind CSS](https://tailwindcss.com)** & **[tw-animate-css](https://github.com/Wombosvideo/tw-animate-css)** — styling and animation utilities.
- **[Motion](https://motion.dev)** — UI animations.
- **[Phosphor Icons](https://phosphoricons.com)** — the icon set.
- **[music-metadata](https://github.com/borewit/music-metadata)** by Borewit — audio tag & artwork parsing.
- **[Material Color Utilities](https://github.com/material-foundation/material-color-utilities)** by Google / Material Foundation — the Material 3 dynamic color engine.
- **[LyricsPlus / KPoe](https://github.com/ibratabian17/lyricsplus)** and **[YouLy+](https://youlyplus.prjktla.my.id/)** by ibratabian17 — the open-source synchronized lyrics API. The lyrics parsing approach was informed by the [apple-music-web-components](https://github.com/binimum/apple-music-web-components) reference client.
- **[next-themes](https://github.com/pacocoursey/next-themes)**, **[Sonner](https://sonner.emilkowal.ski)**, **[Tweakpane](https://tweakpane.github.io/docs/)**, **[class-variance-authority](https://cva.style)**, **[clsx](https://github.com/lukeed/clsx)**, and **[tailwind-merge](https://github.com/dcastil/tailwind-merge)**.
- Browser platform: the **[Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)**, **HTMLAudioElement**, **File API**, and **Canvas**.
- Scaffolded and iterated with **[Claude Code](https://claude.com/claude-code)**.

Lyrics are provided by third-party sources via the LyricsPlus/KPoe API and remain the property of their respective owners; this project is for personal use.

---

## 📄 License

No license has been chosen yet — add one (e.g. via [choosealicense.com](https://choosealicense.com)) if you intend others to reuse the code. This is a personal project and is **not affiliated** with Apple Music, Spotify, or any lyrics provider; all trademarks and lyrics belong to their respective owners.
