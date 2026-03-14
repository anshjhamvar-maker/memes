# Memes 4EVER!! 🎭

A full-stack meme browser with **real-time chat**, friend requests, reactions, themes, achievements, and more.

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/memes4ever
cd memes4ever
npm install
node server.js
# → Open http://localhost:3000
```

## Features

### 🔐 Accounts
- Sign up / log in with username + password (hashed server-side)
- Session token stored in browser — stays logged in across refreshes
- Edit display name and avatar colour
- **Delete account** (permanent, requires password confirmation)
- Export all your meme data as JSON

### 👥 Friends & Social
- **Real friend requests** — both users must accept before becoming friends
- Live user search as you type — shows online status
- 🟢 Online / ⚫ Offline presence indicators
- Friend activity & leaderboard

### 💬 Real-Time Chat (Socket.IO)
- Messages delivered instantly when recipient is online
- Typing indicators (three-dot animation)
- Send memes directly into a conversation from any meme card
- Message history stored on server
- Auto-reply simulation for offline friends
- Full conversation list with unread badges

### 😂 Meme Browsing
- 20+ subreddits across Funny, Gaming, and Animals
- No repeats — seen memes remembered per user per subreddit
- ← → arrow keys or swipe to navigate
- Slide or Zoom transition styles
- Autoplay slideshow mode (5s / 10s)
- Download any meme (⬇ or `D` key)

### ❤️ Saving & Reacting
- Like memes with simulated community like count
- 😂💀😮🔥 Four reaction types
- **Collections** — create named folders and save memes into them
- **History** — last 300 memes viewed
- Search liked / history by title or subreddit
- Sort by newest, oldest, or subreddit

### ✨ Discovery
- **For You** feed weighted by your liked subreddits
- **Meme of the Day** — one deterministic meme per calendar date
- **Meme Battle** — full memes side by side, pick the funnier one (full image, no cropping)

### 🏅 Gamification
- Daily streak tracker
- 10 achievements to unlock
- Friend leaderboard with score ranking

### 🎨 Themes
Void · Neon Tokyo · Pastel Dream · Retro 8-Bit · Ocean Deep

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `→` | Next meme |
| `←` | Previous meme |
| `L` | Like / unlike |
| `D` | Download |
| `S` | Send to friend |
| `C` | Save to collection |
| `?` | Show shortcuts |

## Deployment

### Local
```bash
npm install && node server.js
```

### Railway / Render / Fly.io (free tier)
1. Push to GitHub
2. Connect the repo to Railway / Render
3. Set start command: `node server.js`
4. Deploy — the `data/` directory is created automatically

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |

## Project Structure

```
memes4ever/
├── server.js          # Express + Socket.IO server
├── package.json
├── .gitignore
├── public/
│   └── index.html     # Full client app (single file)
├── data/              # Auto-created, gitignored — JSON storage
│   ├── users.json
│   ├── friendships.json
│   ├── requests.json
│   └── msgs.json
├── README.md
└── LICENSE
```

## Tech Stack
- **Server:** Node.js · Express · Socket.IO
- **Storage:** Flat JSON files (no database needed)
- **Client:** Vanilla JS · CSS variables · Web Audio API
- **Memes:** [Meme API by D3vd](https://github.com/D3vd/Meme_Api) (Reddit CDN)
- **Fonts:** Google Fonts (Boogaloo, Nunito, Orbitron, Press Start 2P)

## Legal

**Application code** — MIT License. See [LICENSE](LICENSE).

**Meme images** — fetched from Reddit at runtime via [Meme API](https://github.com/D3vd/Meme_Api) (MIT). Images belong to original Reddit authors and are subject to [Reddit's User Agreement](https://www.redditinc.com/policies/user-agreement). This app does not host or store any images.

**Fonts** — [SIL Open Font License 1.1](https://scripts.sil.org/OFL).

| Resource | License |
|---|---|
| [Meme API by D3vd](https://github.com/D3vd/Meme_Api) | MIT |
| [Socket.IO](https://socket.io) | MIT |
| [Express](https://expressjs.com) | MIT |
| [Google Fonts](https://fonts.google.com) | SIL OFL 1.1 |
| Web Audio API | Browser built-in |
