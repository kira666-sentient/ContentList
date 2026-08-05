import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { CONFIG } from '../src/config.js';
import { searchBooks, getBookDetails } from '../src/api/books.js';
import { searchMusic, getMusicDetails } from '../src/api/music.js';
import { searchPodcasts, getPodcastDetails } from '../src/api/podcasts.js';
import { searchRAWG, getRAWGDetails } from '../src/api/rawg.js';

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
        await sendTelegramMessage(chatId, "👋 Welcome to your ContentList Bot!\n\nJust tell me what movie, TV show, game, book, or song you want to add. For example:\n<i>\"Add the movie inception\"</i>\n<i>\"Add the game Portal 2\"</i>\n<i>\"Add the book Atomic Habits\"</i>");
        return res.status(200).send('OK');
      }

      // Step A: Use Gemini to extract the intent and fix typos
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
      
      const prompt = `
        You are an assistant for a media tracker app. 
        A user wants to add a piece of media to their list. 
        Extract the exact title and media type. 
        The type MUST be one of: 'movie', 'tv', 'game', 'book', 'music', 'podcast'. 
        If they say 'series', 'show', or 'anime', classify it as 'tv'.
        If they say 'film', classify it as 'movie'.
        If they say 'song', 'album', or 'artist', classify it as 'music'.
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

      // Step B: Search the appropriate API based on Gemini's classification
      let results = [];
      
      if (extracted.type === 'movie' || extracted.type === 'tv') {
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(queryTitle)}`);
        const tmdbData = await tmdbRes.json();
        results = tmdbData.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').map(r => ({
          id: r.id,
          title: r.title || r.name,
          year: (r.release_date || r.first_air_date || '').split('-')[0],
          type: r.media_type
        }));
      } else if (extracted.type === 'game') {
        results = await searchRAWG(queryTitle);
      } else if (extracted.type === 'book') {
        results = await searchBooks(queryTitle);
      } else if (extracted.type === 'music') {
        results = await searchMusic(queryTitle);
      } else if (extracted.type === 'podcast') {
        results = await searchPodcasts(queryTitle);
      }

      if (results.length === 0) {
        const safeTitle = queryTitle.length > 40 ? queryTitle.substring(0, 40) + '...' : queryTitle;
        const fallbackText = `❌ I couldn't find anything matching "<b>${queryTitle}</b>" in the main database.\n\nWould you like to force-add it as a Custom Item?`;
        const fallbackMarkup = {
          inline_keyboard: [[
            { text: '🛠️ Add as Custom Item', callback_data: `add_custom_${safeTitle}` },
            { text: '❌ Cancel', callback_data: `cancel` }
          ]]
        };
        await sendTelegramMessage(chatId, fallbackText, fallbackMarkup);
        return res.status(200).send('OK');
      }

      const topResult = results[0];
      const title = topResult.title;
      const year = topResult.year;
      const type = topResult.type || extracted.type; 
      
      const responseText = year ? `Found: <b>${title}</b> (${year})\nDo you want to add this to your list?` : `Found: <b>${title}</b>\nDo you want to add this to your list?`;
      
      // Inline Keyboard with the exact type and ID
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
        const type = parts[1];
        const id = parts.slice(2).join('_'); // Safe extraction in case ID has underscores

        let itemData = null;

        // Fetch exact details based on type
        if (type === 'movie' || type === 'tv') {
          const tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${CONFIG.TMDB_API_KEY}`);
          const details = await tmdbRes.json();
          itemData = {
            id: `${type}_${details.id}`,
            originalId: details.id,
            title: details.title || details.name,
            type: type,
            year: (details.release_date || details.first_air_date || '').split('-')[0],
            poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
            rating: details.vote_average || 0
          };
        } else if (type === 'game') {
          itemData = await getRAWGDetails(id);
        } else if (type === 'book') {
          itemData = await getBookDetails(id);
        } else if (type === 'music') {
          itemData = await getMusicDetails(id);
        } else if (type === 'podcast') {
          itemData = await getPodcastDetails(id);
        } else if (type === 'custom') {
          // Fallback for custom items that weren't found in any database
          itemData = {
            id: `custom_${Date.now()}`,
            originalId: `custom_${Date.now()}`,
            title: parts.slice(2).join('_'), // Reconstruct the title from the callback data
            type: 'custom',
            year: new Date().getFullYear().toString(),
            poster: '',
            rating: 0
          };
        }

        if (!itemData) {
           await editTelegramMessage(chatId, messageId, `❌ <i>Error fetching full details for this item.</i>`);
           return res.status(200).send('OK');
        }

        const title = itemData.title;

        // Apply shared default fields
        itemData.status = 'plan';
        itemData.personalRating = 0;
        itemData.personalNotes = 'Added via Telegram Bot';
        itemData.updatedAt = new Date().toISOString();

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
