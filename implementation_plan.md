# ContentList — Premium Content Tracker

A cross-platform web app to search, review, and track **all** your content — movies, TV shows, anime, games, books, music, and podcasts — synced across every device with a premium UI.

---

## What You Need to Set Up (All Free)

| Step | What | Where | You Get |
|:---|:---|:---|:---|
| 1 | Firebase project + Google Sign-In + Firestore | [console.firebase.google.com](https://console.firebase.google.com) | Firebase config object |
| 2 | TMDB API key | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) | API key |
| 3 | RAWG API key | [rawg.io/apidocs](https://rawg.io/apidocs) | API key |

Books, Music, and Podcasts use free APIs with **no keys needed** (Google Books, Deezer, iTunes Search).

> [!TIP]
> You can set these up now or after I build. There's one `config.js` file where you paste all keys.

---

## Tech Stack

| Layer | Technology | Why |
|:---|:---|:---|
| **Build** | Vite + Vanilla JS | Fast, lightweight, zero bloat |
| **Styling** | Vanilla CSS + custom properties | Full design control, no framework quirks |
| **Auth & Sync** | Firebase Auth (Google Sign-In) + Firestore | Free tier, real-time sync, Google login |
| **Movies / TV / Anime** | TMDB API | Ratings, reviews, posters, trailers, streaming providers |
| **Games** | RAWG API | Metacritic scores, screenshots, platforms |
| **Books** | Google Books API | Covers, descriptions, ratings, no key needed |
| **Music** | Deezer API | Album art, previews, artist info, no key needed |
| **Podcasts** | iTunes Search API | Podcast art, ratings, episodes, no key needed |
| **Typography** | Google Fonts (Inter) | Clean, modern, premium |

---

## Content Categories (7 Total)

| Category | Data Source | What You See |
|:---|:---|:---|
| 🎬 Movies | TMDB | Poster, ratings, reviews, cast, trailer, where to watch |
| 📺 TV Shows | TMDB | Poster, ratings, reviews, seasons/episodes, where to watch |
| ⛩️ Anime | TMDB (animation genre) | Poster, ratings, reviews, episodes, where to watch |
| 🎮 Games | RAWG | Screenshots, Metacritic score, platforms, genres |
| 📚 Books | Google Books | Cover, description, author, page count, rating |
| 🎵 Music | Deezer | Album art, artist, tracklist, 30s preview |
| 🎙️ Podcasts | iTunes Search | Artwork, description, episode count, rating |

---

## List Statuses (6 Total)

| Status | Icon | Meaning |
|:---|:---|:---|
| Plan to Watch/Play/Read/Listen | ⏳ | Haven't started |
| In Progress | ▶️ | Currently consuming |
| On Hold | ⏸️ | Paused for now |
| Completed | ✅ | Finished |
| Dropped | ❌ | Gave up on it |
| Favorites | ⭐ | Personal top picks |

---

## Design System

**Premium dark theme** — like Apple TV+ meets Letterboxd:

- Deep charcoal backgrounds (not pure black) with warm accent colors
- **8px spacing grid** — every margin, padding, gap is a multiple of 8
- **No borders** — separation through subtle elevation and background tone shifts
- **No tacky animations** — only smooth fades, gentle scale on hover, crisp transitions
- **Generous whitespace** — nothing cramped, nothing touching edges awkwardly
- **High-contrast text** — WCAG AA compliant
- **Frosted glass** on modals/overlays only (sparingly)
- **Fluid responsive** — CSS Grid + media queries for phone (375px), tablet (768px), desktop (1440px)
- **Skeleton loading** — animated placeholders while content loads (no spinners, no blank screens)

---

## All Features

### 1. Universal Search (Home Page)
- Single search bar — type anything
- **7 category tabs**: All | Movies | TV | Anime | Games | Books | Music | Podcasts
- Beautiful cards with artwork, year/author, and rating badge
- Debounced input (300ms) for smooth typing
- Skeleton loading states
- Recent searches saved locally

### 2. Content Detail Page
- Full-width backdrop/artwork with gradient overlay
- Title, year, genres, runtime/episodes/pages
- **Ratings aggregation**: TMDB rating, IMDB score (via TMDB), Metacritic (games), Google Books rating, Deezer rating
- **Reviews section**: User reviews from TMDB / RAWG
- **Where to Watch**: Streaming providers with logos (Netflix, Prime, etc.) — movies/TV/anime only
- **"More Like This"**: Recommended similar content from TMDB/RAWG
- Cast/crew (movies/TV), developer/publisher (games), author (books), artist (music)
- Trailer embed (YouTube) for movies/TV/anime
- 30-second music preview for albums
- "Add to My List" button with status dropdown
- Personal rating (1–10) and notes field

### 3. My List (Synced via Firebase)
- Filter by content type (7 categories)
- Filter by status (6 statuses)
- Sort by: Date Added, Rating, Title, Year
- Quick status change from list view
- Quick personal rating from list view
- Personal notes visible on hover/tap
- **Season/Episode tracker** for TV & Anime — mark which season/episode you're on
- **Page tracker** for Books — mark current page
- Empty states with friendly prompts
- Real-time sync across all devices via Firestore

### 4. Dashboard (Home Page — Logged In)
- Welcome with profile name + avatar
- **Stats cards**: Total items tracked, by category, by status
- "Continue Watching/Playing/Reading" — In Progress items front and center
- Recently added items
- Quick search always accessible at top

### 5. Authentication
- Google Sign-In (one-tap mobile, popup desktop)
- Persistent session
- Profile avatar + name in navbar
- Guest mode: browse and search freely, "Add to List" prompts sign-in
- Sign-out option

### 6. PWA (Installable)
- `manifest.json` for "Add to Home Screen"
- Service worker for offline access to your list
- App icon and splash screen
- Launches fullscreen like a native app

### 7. Share
- Share button on any content detail page
- "Copy Link" to share content with others
- Native share sheet on mobile (Web Share API)

### 8. Import
- CSV import for bulk adding items to your list
- Accepts exports from MAL, Letterboxd, or any spreadsheet

---

## Project Structure

```
ContentList/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   └── sw.js                    # Service worker for PWA
├── src/
│   ├── main.js                  # App init, routing, auth state
│   ├── config.js                # All API keys + Firebase config
│   ├── style.css                # Complete design system + all styles
│   ├── router.js                # Hash-based SPA router
│   ├── auth/
│   │   └── auth.js              # Google Sign-In, sign-out, auth listener
│   ├── api/
│   │   ├── tmdb.js              # Movies, TV, Anime
│   │   ├── rawg.js              # Games
│   │   ├── books.js             # Google Books
│   │   ├── music.js             # Deezer
│   │   └── podcasts.js          # iTunes Search
│   ├── db/
│   │   └── firestore.js         # Firestore CRUD for user lists
│   ├── components/
│   │   ├── navbar.js            # Top navigation
│   │   ├── searchBar.js         # Search input + category tabs
│   │   ├── contentCard.js       # Card for results & lists
│   │   ├── contentDetail.js     # Full detail view
│   │   ├── listView.js          # User's list with filters
│   │   ├── dashboard.js         # Stats + continue watching
│   │   ├── episodeTracker.js    # Season/episode/page tracker
│   │   ├── importModal.js       # CSV import modal
│   │   ├── shareButton.js       # Share functionality
│   │   ├── toast.js             # Notification toasts
│   │   └── skeleton.js          # Loading skeletons
│   └── pages/
│       ├── home.js              # Dashboard (logged in) / Search landing (guest)
│       ├── detail.js            # Content detail page
│       └── myList.js            # Personal list page
```

---

## File Details

### Root Files

#### [NEW] `index.html`
Entry point with SEO meta tags, Open Graph tags, Google Fonts import, Vite entry point.

#### [NEW] `package.json`
Dependencies: `vite`, `firebase`. Dev server and build scripts.

#### [NEW] `vite.config.js`
Vite configuration for dev server and production build.

### Public

#### [NEW] `public/manifest.json`
PWA manifest: app name, icons, theme color, display mode (standalone).

#### [NEW] `public/sw.js`
Service worker: caches app shell + user list data for offline access.

#### [NEW] `public/favicon.svg`
App icon.

### Source — Config & Core

#### [NEW] `src/config.js`
**Single file with all keys.** Firebase config, TMDB key, RAWG key. User edits only this file.

#### [NEW] `src/main.js`
App bootstrap: init Firebase, set up router, render initial page, listen for auth state changes.

#### [NEW] `src/style.css`
Complete design system:
- CSS custom properties (colors, spacing, typography, shadows, radii)
- CSS reset
- Layout utilities (container, grid)
- All component styles
- Responsive breakpoints (mobile-first: 480px, 768px, 1024px, 1440px)
- Tasteful keyframe animations (fade-in, slide-up)
- Skeleton loading styles
- Print styles

#### [NEW] `src/router.js`
Hash-based SPA router. Routes: `#/` (home), `#/detail/:type/:id` (detail), `#/list` (my list).

### Source — Auth

#### [NEW] `src/auth/auth.js`
Firebase Auth: `signInWithGoogle()`, `signOut()`, `onAuthStateChanged()`, `getCurrentUser()`.

### Source — API Clients

#### [NEW] `src/api/tmdb.js`
TMDB: `searchMulti()`, `getMovieDetails()`, `getTVDetails()`, `getReviews()`, `getCredits()`, `getTrailers()`, `getWatchProviders()`, `getRecommendations()`. Anime = TV filtered by animation genre.

#### [NEW] `src/api/rawg.js`
RAWG: `searchGames()`, `getGameDetails()`, `getGameScreenshots()`.

#### [NEW] `src/api/books.js`
Google Books: `searchBooks()`, `getBookDetails()`. No API key needed for basic queries.

#### [NEW] `src/api/music.js`
Deezer: `searchAlbums()`, `searchArtists()`, `getAlbumDetails()`, `getArtistDetails()`. No key needed. Uses CORS proxy.

#### [NEW] `src/api/podcasts.js`
iTunes Search: `searchPodcasts()`, `getPodcastDetails()`. No key needed.

### Source — Database

#### [NEW] `src/db/firestore.js`
Firestore operations:
- `addToList(item)` — save content with status, rating, notes, progress
- `removeFromList(id)` — delete from list
- `updateStatus(id, status)` — change status
- `updateProgress(id, progress)` — update episode/page number
- `updateRating(id, rating)` — set personal rating
- `updateNotes(id, notes)` — save personal notes
- `getUserList(filters)` — fetch list with optional filters
- `isInList(id)` — check if content is already saved
- `getStats()` — aggregate counts for dashboard
- `importFromCSV(data)` — bulk import

Firestore structure: `users/{uid}/contentList/{contentId}`

### Source — Components

Each component is a JS module that exports a render function returning DOM elements. Clean DOM manipulation with template literals.

#### [NEW] `src/components/navbar.js`
Top nav: logo, search trigger, My List link, profile avatar / sign-in button. Sticky, responsive.

#### [NEW] `src/components/searchBar.js`
Search input with 7 category tabs. Debounced. Recent searches dropdown.

#### [NEW] `src/components/contentCard.js`
Card: artwork, title, year/author, rating badge, content type indicator. Hover: subtle scale. Tap: navigate to detail.

#### [NEW] `src/components/contentDetail.js`
Full detail: backdrop, metadata, ratings, reviews, where to watch, recommendations, add-to-list controls, personal rating, notes, share button.

#### [NEW] `src/components/listView.js`
List: filter bar (type + status), sort dropdown, content cards with quick-edit controls for status/rating.

#### [NEW] `src/components/dashboard.js`
Stats cards, "Continue" section (in-progress items), recently added.

#### [NEW] `src/components/episodeTracker.js`
For TV/Anime: season + episode number inputs. For Books: current page input. Inline in list view and detail page.

#### [NEW] `src/components/importModal.js`
Modal: file upload (CSV), preview parsed data, confirm import.

#### [NEW] `src/components/shareButton.js`
Share: copy link, Web Share API on mobile.

#### [NEW] `src/components/toast.js`
Toast notifications: "Added to list", "Status updated", etc. Auto-dismiss.

#### [NEW] `src/components/skeleton.js`
Animated placeholder cards/blocks matching real content dimensions.

### Source — Pages

#### [NEW] `src/pages/home.js`
- **Guest**: Search bar + category tabs + trending content
- **Logged in**: Dashboard stats + Continue Watching + search bar

#### [NEW] `src/pages/detail.js`
Composes `contentDetail` component. Fetches data based on route params (`#/detail/movie/12345`).

#### [NEW] `src/pages/myList.js`
Composes `listView` + `importModal`. Requires auth. Shows full list with all filters and sorting.

---

## Verification Plan

### Automated
```bash
npm run dev    # Dev server starts and serves app
npm run build  # Production build completes without errors
```

### Manual
- Responsive layout test: mobile (375px), tablet (768px), desktop (1440px)
- Search returns results across all 7 categories
- Detail page shows ratings, reviews, where to watch, recommendations
- Google Sign-In works (requires Firebase config)
- Add/remove/update items in list syncs to Firestore
- Episode tracker saves progress
- CSV import parses and adds items
- Share button copies link / opens share sheet
- PWA installs on mobile and launches fullscreen
- Visual inspection: spacing, alignment, premium feel — no gaps, no border issues
