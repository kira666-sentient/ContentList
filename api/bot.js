import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { CONFIG } from '../src/config.js';

// Initialize Firebase (using the web config from src/config.js)
const firebaseApp = initializeApp(CONFIG.FIREBASE);
const db = getFirestore(firebaseApp);

export default async function handler(req, res) {
  // Only allow POST requests for the webhook
  if (req.method !== 'POST') {
    return res.status(200).send('Telegram Bot Webhook is running.');
  }

  const { message, callback_query } = req.body;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const FIREBASE_UID = process.env.FIREBASE_USER_UID;

  if (!TELEGRAM_TOKEN || !GEMINI_API_KEY || !FIREBASE_UID) {
    console.error('Missing Environment Variables!');
    return res.status(500).send('Server configuration error.');
  }

  const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  // Helper to send messages to Telegram
  const sendTelegramMessage = async (chatId, text, replyMarkup = null) => {
    const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  // Helper to edit messages (used after clicking a button)
  const editTelegramMessage = async (chatId, messageId, text) => {
    await fetch(`${TELEGRAM_API}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' })
    });
  };

  try {
    // ----------------------------------------------------------------------
    // 1. HANDLE INCOMING TEXT MESSAGES
    // ----------------------------------------------------------------------
    if (message && message.text) {
      const chatId = message.chat.id;
      const userText = message.text;

      if (userText.startsWith('/start')) {
        await sendTelegramMessage(chatId, "👋 Welcome to your ContentList Bot!\n\nJust tell me what movie or TV show you want to add. For example:\n<i>\"Add the movie inception\"</i>\n<i>\"Add breaking bad\"</i>");
        return res.status(200).send('OK');
      }

      // Step A: Use Gemini to extract the intent and fix typos
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        You are an assistant for a media tracker app. 
        A user wants to add a piece of media to their list. 
        Extract the exact title and media type. 
        The type MUST be either 'movie' or 'tv'. 
        If they say 'series', 'show', or 'anime', classify it as 'tv'.
        If they say 'film', classify it as 'movie'. 
        Fix any obvious spelling errors in the title.
        
        User input: "${userText}"
        
        Output ONLY a valid raw JSON object with 'title' and 'type', and nothing else. No markdown formatting.
        Example: {"title": "Inception", "type": "movie"}
      `;

      const geminiResult = await model.generateContent(prompt);
      let jsonText = geminiResult.response.text().trim();
      // Clean up markdown block if Gemini ignores instructions
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
      }
      
      const extracted = JSON.parse(jsonText);
      const queryTitle = extracted.title;

      // Step B: Search TMDB with the cleaned title
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(queryTitle)}`);
      const tmdbData = await tmdbRes.json();
      
      // Filter for movies and tv
      const results = tmdbData.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');

      if (results.length === 0) {
        await sendTelegramMessage(chatId, `❌ I couldn't find anything matching "<b>${queryTitle}</b>" on TMDB.`);
        return res.status(200).send('OK');
      }

      const topResult = results[0];
      const title = topResult.title || topResult.name;
      const year = (topResult.release_date || topResult.first_air_date || '').split('-')[0];
      const type = topResult.media_type; // 'movie' or 'tv'
      
      const responseText = `Found: <b>${title}</b> (${year})\nDo you want to add this to your list?`;
      
      // Inline Keyboard with the TMDB ID
      const replyMarkup = {
        inline_keyboard: [[
          { text: '✅ Add to Plan to Watch', callback_data: `add_${type}_${topResult.id}` },
          { text: '❌ Cancel', callback_data: `cancel` }
        ]]
      };

      await sendTelegramMessage(chatId, responseText, replyMarkup);
      return res.status(200).send('OK');
    }

    // ----------------------------------------------------------------------
    // 2. HANDLE BUTTON CLICKS (CALLBACK QUERIES)
    // ----------------------------------------------------------------------
    if (callback_query) {
      const chatId = callback_query.message.chat.id;
      const messageId = callback_query.message.message_id;
      const data = callback_query.data; // e.g. "add_movie_27205" or "cancel"

      if (data === 'cancel') {
        await editTelegramMessage(chatId, messageId, "<i>Action cancelled.</i>");
        return res.status(200).send('OK');
      }

      if (data.startsWith('add_')) {
        const parts = data.split('_');
        const type = parts[1]; // 'movie' or 'tv'
        const id = parts[2];

        // Fetch exact details from TMDB to get the poster and full data
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${CONFIG.TMDB_API_KEY}`);
        const details = await tmdbRes.json();

        const title = details.title || details.name;
        const year = (details.release_date || details.first_air_date || '').split('-')[0];
        
        const itemData = {
          id: `${type}_${details.id}`,
          originalId: details.id,
          title: title,
          type: type,
          year: year,
          poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
          rating: details.vote_average || 0,
          status: 'plan', // Automatically add to 'Plan to Watch'
          personalRating: 0,
          personalNotes: 'Added via Telegram Bot',
          updatedAt: new Date().toISOString()
        };

        // Save directly to Firebase Database using Client SDK!
        const docRef = doc(db, 'users', FIREBASE_UID, 'contentList', itemData.id);
        await setDoc(docRef, itemData, { merge: true });

        await editTelegramMessage(chatId, messageId, `✅ <b>${title}</b> has been successfully added to your "Plan to Watch" list!`);
        return res.status(200).send('OK');
      }
    }

    // Default response if neither message nor callback
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook Error:', error);
    // Attempt to notify user of error if possible
    if (message && message.chat) {
      await sendTelegramMessage(message.chat.id, "⚠️ Sorry, an error occurred while processing your request.");
    }
    return res.status(200).send('Error processed');
  }
}
