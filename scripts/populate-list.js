import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Because we're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Web Config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBqnkA_1fEXrAkoWUMRsump_MKmQzX7y8M",
  authDomain: "contentlist-ff6cd.firebaseapp.com",
  projectId: "contentlist-ff6cd",
  storageBucket: "contentlist-ff6cd.firebasestorage.app",
  messagingSenderId: "710364837341",
  appId: "1:710364837341:web:b873df965d020682613234"
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const TMDB_API_KEY = '1c06cd317132aca8e1fc438fdad1c9c3';
const FIREBASE_UID = process.env.FIREBASE_USER_UID;

if (!FIREBASE_UID) {
  console.error("Missing FIREBASE_USER_UID in .env file");
  process.exit(1);
}

const items = [
  // Anime & Animated Shows (Searching TMDB as 'tv' or 'movie')
  { query: 'Rascal Does Not Dream', expectedType: 'tv' },
  { query: 'Welcome to Demon School! Iruma-kun', expectedType: 'tv' },
  { query: 'Transformers Prime Beast Hunters Predacons Rising', expectedType: 'movie' },
  { query: 'High-Rise Invasion', expectedType: 'tv' },
  { query: 'UQ Holder', expectedType: 'tv' },
  { query: 'Yu Yu Hakusho', expectedType: 'tv' },
  { query: 'Inazuma Eleven', expectedType: 'tv' },
  { query: 'The Legend of Korra', expectedType: 'tv' },

  // Movies & TV Shows
  { query: 'This Is the End', expectedType: 'movie' },
  { query: 'Real Steel', expectedType: 'movie' },
  { query: 'Ghost in the Shell', expectedType: 'movie' },
  { query: 'Handsome Guys', expectedType: 'movie' },
  { query: 'Oldboy', expectedType: 'movie' },
  { query: 'Bloodhounds', expectedType: 'tv' },
  { query: 'Better Off Ted', expectedType: 'tv' }
];

const games = [
  { title: 'Spider-Man: Shattered Dimensions', type: 'game' },
  { title: 'The Outer Worlds: Spacer\'s Choice Edition', type: 'game' }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchTMDB(query, expectedType) {
  const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  
  if (!data.results || data.results.length === 0) return null;

  // Try to find the exact type first, fallback to first result
  let result = data.results.find(r => r.media_type === expectedType) || data.results[0];
  
  // If it's a person or something weird, skip
  if (result.media_type !== 'movie' && result.media_type !== 'tv') return null;

  // Fetch full details
  const detailRes = await fetch(`https://api.themoviedb.org/3/${result.media_type}/${result.id}?api_key=${TMDB_API_KEY}`);
  const details = await detailRes.json();

  return {
    id: `${result.media_type}_${details.id}`,
    originalId: details.id,
    title: details.title || details.name,
    type: result.media_type,
    year: (details.release_date || details.first_air_date || '').split('-')[0],
    poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
    rating: details.vote_average || 0,
    status: 'plan', // Defaulting everything to 'Plan to Watch'
    personalRating: 0,
    personalNotes: 'Added via bulk script',
    updatedAt: new Date().toISOString()
  };
}

async function run() {
  console.log(`Adding items to Firebase for user: ${FIREBASE_UID}...\n`);

  for (const item of items) {
    console.log(`Searching TMDB for: ${item.query}...`);
    const tmdbData = await searchTMDB(item.query, item.expectedType);
    
    if (tmdbData) {
      const docRef = doc(db, 'users', FIREBASE_UID, 'contentList', tmdbData.id);
      await setDoc(docRef, tmdbData, { merge: true });
      console.log(`✅ Added: ${tmdbData.title}`);
    } else {
      console.log(`❌ Failed to find: ${item.query}`);
    }
    
    // Slight delay to avoid rate limits
    await delay(250);
  }

  console.log('\nAdding Games...');
  for (const game of games) {
    // Generate a slug ID
    const gameId = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const gameData = {
      id: `game_${gameId}`,
      originalId: gameId,
      title: game.title,
      type: 'game',
      year: '',
      poster: 'https://placehold.co/400x600/1e1e2e/6c7086.png?text=No+Poster', // Placeholder since no RAWG key
      rating: 0,
      status: 'plan',
      personalRating: 0,
      personalNotes: 'Added via bulk script',
      updatedAt: new Date().toISOString()
    };

    const docRef = doc(db, 'users', FIREBASE_UID, 'contentList', gameData.id);
    await setDoc(docRef, gameData, { merge: true });
    console.log(`✅ Added: ${game.title}`);
  }

  console.log('\n🎉 Finished adding all items to your list!');
  process.exit(0);
}

run();
