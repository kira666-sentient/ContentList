import { CONFIG } from '../config.js';

const RAWG_BASE_URL = 'https://rawg.io/api';

const DEMO_GAMES = [
  {
    id: 3498,
    title: "Grand Theft Auto V",
    type: "game",
    year: "2013",
    rating: 9.2,
    poster: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900_2x.jpg",
    backdrop: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_hero.jpg",
    overview: "Grand Theft Auto V is a vast open world game set in Los Santos and Blaine County."
  },
  {
    id: 3328,
    title: "The Witcher 3: Wild Hunt",
    type: "game",
    year: "2015",
    rating: 9.6,
    poster: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900_2x.jpg",
    backdrop: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_hero.jpg",
    overview: "The Witcher 3: Wild Hunt is a story-driven open world RPG set in a visually stunning fantasy universe."
  },
  {
    id: 4200,
    title: "Portal 2",
    type: "game",
    year: "2011",
    rating: 9.8,
    poster: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/library_600x900_2x.jpg",
    backdrop: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/library_hero.jpg",
    overview: "Portal 2 draws from the award-winning formula of innovative gameplay, story, and music."
  },
  {
    id: 1091500,
    title: "Cyberpunk 2077",
    type: "game",
    year: "2020",
    rating: 8.6,
    poster: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900_2x.jpg",
    backdrop: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg",
    overview: "Cyberpunk 2077 is an open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification."
  }
];

export async function searchRAWG(query) {
  if (!query) return DEMO_GAMES; // CheapShark requires a query

  try {
    const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=12`);
    const data = await res.json();
    
    return data.map(g => {
      // Build perfect high-res Steam URLs using the steamAppID if available!
      const highResPoster = g.steamAppID 
        ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.steamAppID}/library_600x900_2x.jpg` 
        : g.thumb;
      const highResBackdrop = g.steamAppID 
        ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.steamAppID}/library_hero.jpg` 
        : g.thumb;
      
      return {
        id: g.gameID,
        title: g.external,
        type: 'game',
        year: '',
        rating: 0,
        poster: highResPoster,
        fallbackPoster: g.thumb,
        backdrop: highResBackdrop,
        overview: 'No detailed overview available.'
      };
    });
  } catch (err) {
    console.error('CheapShark Search Error:', err);
    return DEMO_GAMES.filter(g => g.title.toLowerCase().includes(query.toLowerCase()));
  }
}

export async function getRAWGDetails(id) {
  // If it's a demo game
  const demo = DEMO_GAMES.find(g => g.id == id);
  if (demo) {
    return {
      ...demo,
      genres: ['Action', 'RPG', 'Open World'],
      platforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
      metacritic: 96
    };
  }

  try {
    const res = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${id}`);
    const data = await res.json();
    const info = data.info;
    // Build perfect high-res Steam URLs using the steamAppID
    const highResPoster = info.steamAppID 
      ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${info.steamAppID}/library_600x900_2x.jpg` 
      : info.thumb;
    const highResBackdrop = info.steamAppID 
      ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${info.steamAppID}/library_hero.jpg` 
      : info.thumb;

    return {
      id: id,
      title: info.title,
      type: 'game',
      year: '',
      rating: 0,
      poster: highResPoster,
      fallbackPoster: info.thumb,
      backdrop: highResBackdrop,
      overview: 'Detailed stats and overview are limited for this source.'
    };
  } catch (err) {
    console.error('CheapShark Details Error:', err);
    return null;
  }
}
