# ContentList & Telegram Bot

A highly optimized, mobile-first Web Application built with Vite and Vanilla CSS to track movies, TV shows, games, and books. It includes a custom Telegram Bot integration that allows you to instantly add media to your list on the go using Google's Gemini AI.

## Project Structure

This project is separated into two major parts:

1. **The Frontend Web App (Client-Side):** Everything inside the `src/` folder. This is the code that runs directly in the user's browser.
2. **The Backend Webhook (Server-Side):** The `api/bot.js` file. This runs on Vercel's Serverless Node.js infrastructure.

---

## 🔒 Security & API Keys Explanation

You might notice that we have API keys in two different places (`config.js` vs `.env`). This is highly intentional and based on how web architecture works.

### Why are Firebase and TMDB keys left in `config.js`?
Because this is a "Client-Side" application (a Single Page Application), the code runs directly on the user's device. To fetch a movie poster or log you in, the browser itself needs those keys.
- **Firebase Keys:** Google explicitly designed Firebase so that `apiKey` and `projectId` are completely public. Your database is kept secure by Firebase Security Rules, not by hiding the key.
- **TMDB Keys:** Similarly, since your browser is making the request to TMDB directly, the key is bundled into the frontend code. Even if we put it in a `.env` file and injected it, a user could simply press F12 and look at their network tab to see the key. It is meant to be public in a client-side context.

**Because these keys must be sent to the browser anyway, it is completely safe and necessary to commit `config.js` to GitHub so Vercel can build your website.**

### Why are Telegram and Gemini keys hidden in `.env`?
Unlike the frontend, the Telegram Bot runs entirely on Vercel's private servers in a Serverless Function (`api/bot.js`). 
These are **Backend Keys**. If someone gets your Telegram Token, they can hijack your bot. If they get your Gemini key, they can run up a massive bill on your Google account.
Because these keys are only used on the server, they NEVER need to be sent to the browser. Therefore, we keep them strictly in the `.env` file, which is blocked from GitHub via our `.gitignore`.

---

## 🤖 The Telegram Bot & Gemini Integration

We set up a Telegram Webhook so that whenever you message the bot, Telegram sends a hidden POST request to `https://your-vercel-app.vercel.app/api/bot`.

### The Gemini API Key Format (`AQ...`)
If you generate a Gemini API key from Google AI Studio, it will start with `AQ.`. This is Google's newer, highly secure "Authentication" key format bound to Google Cloud Service Accounts. 
- **Important Note on GitHub:** If you accidentally upload an `AQ.` key to a public GitHub repository, GitHub's Secret Scanner will immediately partner with Google to **revoke and destroy the key** to protect you. If your bot suddenly starts throwing "Invalid API Key" errors, it's likely your key was exposed and automatically killed.

### The Gemini Model Transition
In August 2026, Google completely deprecated and removed the older `gemini-1.5-flash` models from their API. If you try to use them, the API will crash with a `404 Not Found` error. 

Our bot is configured to use **`gemini-3.6-flash`**, which is the current bleeding-edge model. It is incredibly fast and cheap, perfectly suited for interpreting typos like *"add interstellar"* and instantly extracting JSON data so our bot can query TMDB.

---

## Deployment

To deploy this project:
1. Push your code to GitHub.
2. Import the repository in Vercel.
3. In Vercel, add the following Environment Variables before deploying:
   - `TELEGRAM_BOT_TOKEN`
   - `GEMINI_API_KEY`
   - `FIREBASE_USER_UID`
4. Once deployed, run `node scripts/register-webhook.js https://your-deployment.vercel.app` locally to bind your Telegram bot to Vercel.
