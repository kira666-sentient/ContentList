# ContentList Handoff Context
*Generated for future AI assistants or developers to quickly understand the project state.*

## 1. Project Overview
**ContentList** is a mobile-first, highly optimized Single Page Application (SPA) designed to track media (Movies, TV, Anime, Games, Books, Music, Podcasts). It features a sleek glassmorphism UI, a Firebase backend for auth and database, and a Telegram Bot powered by Gemini to add media via text.

- **Stack:** HTML, Vanilla CSS (`src/style.css`), Vanilla JS, Vite.
- **Backend:** Firebase (Authentication + Firestore v9 Client SDK).
- **Deployment:** Vercel (both Frontend SPA and `/api` Serverless Functions).

## 2. Architecture & File Structure
- `src/main.js`: Entry point. Initializes Firebase auth listener and handles routing.
- `src/router.js`: Basic hash-based router (`/`, `#/mylist`).
- `src/config.js`: Holds Firebase client config and TMDB API key. **(Do NOT hide this in .env for Vite, it must be shipped to client)**.
- `src/auth/auth.js`: Handles Google Sign-In and logout.
- `src/db/firestore.js`: Handles all CRUD operations for the user's list.
- `src/api/*.js`: Modular API fetchers for different media types (TMDB, RAWG, Google Books, etc.).
- `src/style.css`: Contains CSS variables, glassmorphism utilities, animations, and heavy mobile optimizations (e.g., `translateZ(0)`, `@media (hover: hover)` fixes).
- `api/bot.js`: A Vercel Serverless Function acting as the Telegram Webhook.

## 3. The Telegram Bot (Vercel Serverless)
- The bot allows the user to message (e.g., "add inception") to add movies directly to their Firebase list without opening the app.
- **Workflow:** 
  1. Telegram sends POST request to `/api/bot`.
  2. The bot uses `gemini-3.6-flash` (via `@google/generative-ai`) to parse the user's intent and fix typos.
  3. It searches TMDB, sends an Inline Keyboard confirmation to Telegram.
  4. On click, it writes directly to Firestore using the Firebase v9 Client SDK.
- **API Keys:** Stored in Vercel Environment Variables (`TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `FIREBASE_USER_UID`).
- **Important Note:** We had an issue where `gemini-1.5-flash` was deprecated, so the bot MUST use `gemini-3.6-flash`. The Gemini API Key format is `AQ...` (Auth keys). If pushed to GitHub, GitHub Secret Scanner will instantly revoke `AQ...` keys.

## 4. Known Limitations & Future Work (TODOs)
If you are picking up this project, here are the things that are unfinished or might break:
1. **Music & Podcasts:** The APIs for Music and Podcasts in `src/components/searchBar.js` are currently mocking data or using public open APIs that might rate limit. They need robust API keys (like Spotify/ListenNotes) for production.
3. **Telegram Voice Messages:** The user wanted to use Google Assistant to add items, but Assistant blocks bot messaging. A great future feature would be parsing Telegram `message.voice` audio files and passing them to Gemini to allow voice-adding natively in the Telegram chat.
4. **Google Search Grounding Quota:** We attempted to enable Google Search Grounding (`tools: [{ googleSearch: {} }]`) in the Telegram bot so Gemini could accurately classify newly released media. However, the free-tier API key immediately threw a `429 Too Many Requests` quota error when Grounding was enabled. Grounding had to be removed, meaning Gemini relies on its static knowledge base (and falls back to Custom Items if it guesses wrong).
5. **Firebase Security Rules:** The `/api/bot.js` webhook is currently failing to add items (including Custom Items) because it uses the Firebase Client SDK in a Node.js environment without authenticating. This triggers a `7 PERMISSION_DENIED: Missing or insufficient permissions` error from Firebase. To fix this, the bot must be rewritten to use the `firebase-admin` SDK with a Service Account JSON to bypass the security rules.
6. **Multi-User Telegram Bot (Account Linking):** Currently, the Telegram bot is hardcoded to a single user (`FIREBASE_USER_UID` in env vars). To make it public, implement an OAuth or PIN-based account linking system (e.g., user generates a 6-digit PIN in the web app, sends `/link <PIN>` to the bot, and the bot maps their Telegram `chat.id` to their Firebase `uid` in a `telegramUsers` collection).
7. **Telegram Push Notifications:** Add functionality to push notifications from the web app back to the user's Telegram (e.g., "A movie on your Plan to Watch list was just released!").
8. **Social Features:** Allow users to share their lists publicly or add friends to see what they are watching/playing.

## 5. Deployment Notes
- `vercel.json` contains a rewrite for the SPA fallback (`/(.*) -> /index.html`), but it is carefully configured not to break the `/api/*` routes natively handled by Vercel.

## 6. Disaster Recovery: Recreating the Telegram Bot
If the Telegram Bot is ever accidentally deleted or you need to spin up a new one from scratch, follow these exact steps:
1. Open Telegram and message **@BotFather**.
2. Send `/newbot` and follow the prompts to name it and get your new **HTTP API Token**.
3. Go to your **Vercel Dashboard -> Settings -> Environment Variables**.
4. Update `TELEGRAM_BOT_TOKEN` with the new token and click **Save**, then go to **Deployments** and click **Redeploy**.
5. Once redeployed, update the token in your local `.env` file (create it if missing).
6. Run the webhook registration script in your terminal to link the new bot to Vercel:
   `node scripts/register-webhook.js https://your-vercel-deployment-url.vercel.app`
7. The script will output `✅ Webhook successfully registered!`, and your new bot will be fully operational.
