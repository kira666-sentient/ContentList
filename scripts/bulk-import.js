import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { searchRAWG, getRAWGDetails } from '../src/api/rawg.js';
import { CONFIG } from '../src/config.js';

// Items to add
const items = [
  { query: 'Rascal Does Not Dream', expectedType: 'tv' },
  { query: 'Welcome to Demon School Iruma-kun', expectedType: 'tv' },
  { query: 'Transformers Prime Beast Hunters Predacons Rising', expectedType: 'movie' },
  { query: 'High-Rise Invasion', expectedType: 'tv' },
  { query: 'UQ Holder', expectedType: 'tv' },
  { query: 'Yu Yu Hakusho', expectedType: 'tv' },
  { query: 'Inazuma Eleven', expectedType: 'tv' },
  { query: 'The Legend of Korra', expectedType: 'tv' },
  { query: 'This Is the End', expectedType: 'movie' },
  { query: 'Real Steel', expectedType: 'movie' },
  { query: 'Ghost in the Shell', expectedType: 'movie' },
  { query: 'Handsome Guys', expectedType: 'movie' },
  { query: 'Oldboy', expectedType: 'movie' },
  { query: 'Bloodhounds', expectedType: 'tv' },
  { query: 'Better Off Ted', expectedType: 'tv' },
  { query: 'Spider-Man Shattered Dimensions', expectedType: 'game' },
  { query: 'The Outer Worlds Spacers Choice Edition', expectedType: 'game' }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchTMDB(query, expectedType) {
  const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  let result = data.results.find(r => r.media_type === expectedType) || data.results[0];
  if (result.media_type !== 'movie' && result.media_type !== 'tv') return null;

  const detailRes = await fetch(`https://api.themoviedb.org/3/${result.media_type}/${result.id}?api_key=${CONFIG.TMDB_API_KEY}`);
  const details = await detailRes.json();

  return {
    id: `${result.media_type}_${details.id}`,
    originalId: details.id,
    title: details.title || details.name,
    type: result.media_type,
    year: (details.release_date || details.first_air_date || '').split('-')[0],
    poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
    rating: details.vote_average || 0,
    status: 'plan',
    personalRating: 0,
    personalNotes: 'Added via bulk import',
    updatedAt: new Date().toISOString()
  };
}

async function runImport() {
  if (getApps().length === 0) {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
      console.error("Missing FIREBASE_SERVICE_ACCOUNT in .env");
      process.exit(1);
    }
    const serviceAccount = JSON.parse(serviceAccountStr);
    initializeApp({ credential: cert(serviceAccount) });
  }
  const db = getFirestore();
  const FIREBASE_UID = process.env.FIREBASE_USER_UID;

  console.log("Starting bulk import...");
  for (const item of items) {
    let itemData = null;
    
    try {
      if (item.expectedType === 'game') {
        const results = await searchRAWG(item.query);
        if (results && results.length > 0) {
          const topResult = results[0];
          // We need full details for games
          const details = await getRAWGDetails(topResult.id);
          if (details) {
            itemData = {
              id: `game_${details.id}`,
              originalId: details.id,
              title: details.title,
              type: 'game',
              year: details.year,
              poster: details.poster,
              fallbackPoster: details.fallbackPoster,
              rating: details.rating || 0,
              status: 'plan',
              personalRating: 0,
              personalNotes: 'Added via bulk import',
              updatedAt: new Date().toISOString()
            };
          }
        }
      } else {
        itemData = await searchTMDB(item.query, item.expectedType);
      }

      if (itemData) {
        await db.collection('users').doc(FIREBASE_UID).collection('contentList').doc(itemData.id).set(itemData, { merge: true });
        console.log(`✅ API Success: Added ${itemData.title}`);
      } else {
        // If API search fails (e.g. Delisted games, rare anime), gracefully fallback to Custom Item
        itemData = {
          id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          originalId: `custom_${Date.now()}`,
          title: item.query,
          type: item.expectedType,
          year: "",
          poster: "",           // Leave blank so Web App generates gorgeous gradient placeholder
          fallbackPoster: "",   // Leave blank so Web App generates gorgeous gradient placeholder
          backdrop: "",
          rating: 0,
          status: 'plan',
          personalRating: 0,
          personalNotes: 'Added via bulk import (Custom Fallback)',
          updatedAt: new Date().toISOString()
        };
        await db.collection('users').doc(FIREBASE_UID).collection('contentList').doc(itemData.id).set(itemData, { merge: true });
        console.log(`✨ Custom Fallback: Added ${itemData.title}`);
      }
    } catch (e) {
      console.log(`⚠️ Error on ${item.query}: ${e.message}. Creating custom fallback...`);
      // Failsafe custom item generation even on API crash
      const fallbackData = {
          id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          originalId: `custom_${Date.now()}`,
          title: item.query,
          type: item.expectedType,
          year: "",
          poster: "",           
          fallbackPoster: "",   
          backdrop: "",
          rating: 0,
          status: 'plan',
          personalRating: 0,
          personalNotes: `Added via bulk import (Error: ${e.message})`,
          updatedAt: new Date().toISOString()
      };
      await db.collection('users').doc(FIREBASE_UID).collection('contentList').doc(fallbackData.id).set(fallbackData, { merge: true });
      console.log(`✨ Custom Fallback (After Error): Added ${fallbackData.title}`);
    }
    
    await delay(500); // Rate limiting
  }
  console.log("Bulk import complete!");
  process.exit(0);
}

runImport();
