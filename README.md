# Memes 4EVER!! 🎭

A single-file meme browser with accounts, friends, messaging, reactions, themes, and more.
No build step, no dependencies — just open `memes4ever.html` in any modern browser.

## Features

- 🔄 Browse memes from 20+ subreddits — no repeats (seen memes are remembered across sessions)
- ❤️ Like memes and view your likes collection
- 😂💀😮🔥 React to memes
- ✨ For You feed based on your liked subreddits
- 🕓 Meme history (clearing history resets seen memes so they can appear again)
- 👤 Local accounts with username, display name, and avatar colour
- 👥 Add friends by username
- 💬 Send memes and messages to friends (with simulated replies — local only, no server)
- ⬇ Download any meme
- 👆 Swipe left/right on mobile, ←/→ arrow keys on desktop
- 📊 Stats: memes seen, liked, top subreddits, reactions
- 🎨 Five themes: Void, Neon Tokyo, Pastel Dream, Retro 8-Bit, Ocean Deep
- ⭐ Add custom subreddits to the sidebar
- All data stored in `localStorage` — nothing is sent to any server

## Usage

1. Download `memes4ever.html`
2. Open it in a browser
3. That's it

Or host it on any static file host (GitHub Pages, Netlify, etc.).

## Legal

**Application code** is released under the [MIT License](LICENSE).

**Meme images** are fetched at runtime from Reddit via the
[Meme API](https://github.com/D3vd/Meme_Api) (MIT). Images are loaded directly
from Reddit's CDN — this app does not host, store, or redistribute any images.
All meme content belongs to its original Reddit authors and is subject to
[Reddit's User Agreement](https://www.redditinc.com/policies/user-agreement).

**Fonts** (Boogaloo, Nunito, Orbitron, Press Start 2P) are loaded from
[Google Fonts](https://fonts.google.com) and licensed under the
[SIL Open Font License 1.1](https://scripts.sil.org/OFL).

No other third-party libraries or assets are bundled.

## Third-party credits

| Resource | License | Link |
|---|---|---|
| Meme API by D3vd | MIT | https://github.com/D3vd/Meme_Api |
| Google Fonts | SIL OFL 1.1 | https://fonts.google.com |
| Web Audio API | Browser built-in | — |
