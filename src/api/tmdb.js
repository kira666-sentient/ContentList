import { CONFIG } from '../config.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

// Fallback high quality demo content if API key is not yet set
const DEMO_MOVIES = [
  {
    id: 157336,
    title: "Interstellar",
    type: "movie",
    year: "2014",
    rating: 8.4,
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fKSuVcoSY.jpg",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage."
  },
  {
    id: 27205,
    title: "Inception",
    type: "movie",
    year: "2010",
    rating: 8.4,
    poster: "https://image.tmdb.org/t/p/w500/oYuLE1h2CVCdCG2vDjhKmoHMGt.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAiaw.jpg",
    overview: "Cobb, a skilled thief who steals corporate secrets through use of dream-sharing technology, is given the inverse task of planting an idea into the mind of a CEO."
  },
  {
    id: 37854,
    title: "Cyberpunk: Edgerunners",
    type: "anime",
    year: "2022",
    rating: 8.6,
    poster: "https://image.tmdb.org/t/p/w500/7d6wAgan8Lrh6YjCwcZ3Fz6y2gH.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/r9PkG93n82vPqOQ0hF2B9M49t.jpg",
    overview: "A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner."
  },
  {
    id: 92685,
    title: "Jujutsu Kaisen",
    type: "anime",
    year: "2020",
    rating: 8.5,
    poster: "https://image.tmdb.org/t/p/w500/h8gHn0Uvsuhjhj8qwbfF298gH4s.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/4N6zEMfZ5Oo9o5jS.jpg",
    overview: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself."
  },
  {
    id: 1399,
    title: "Game of Thrones",
    type: "tv",
    year: "2011",
    rating: 8.4,
    poster: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1dYpYm.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/2OMG0YKMw3start897.jpg",
    overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war."
  }
];

export async function searchTMDB(query, category = 'all') {
  const apiKey = CONFIG.TMDB_API_KEY;
  if (!apiKey || apiKey === 'YOUR_TMDB_API_KEY') {
    // Return filtered demo content if key isn't provided yet
    return DEMO_MOVIES.filter(item => {
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) || query === '';
      if (category === 'all') return matchesQuery;
      return matchesQuery && item.type === category;
    });
  }

  try {
    let endpoint;
    if (!query) {
      if (category === 'movie') endpoint = `${TMDB_BASE_URL}/trending/movie/day?api_key=${apiKey}`;
      else if (category === 'tv' || category === 'anime') endpoint = `${TMDB_BASE_URL}/trending/tv/day?api_key=${apiKey}`;
      else endpoint = `${TMDB_BASE_URL}/trending/all/day?api_key=${apiKey}`;
    } else {
      endpoint = `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
      if (category === 'movie') endpoint = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
      if (category === 'tv' || category === 'anime') endpoint = `${TMDB_BASE_URL}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    }

    const res = await fetch(endpoint);
    const data = await res.json();
    
    if (!data.results) return [];

    return data.results
      .filter(item => item.poster_path)
      .map(item => {
        const isAnime = category === 'anime' || (item.genre_ids && item.genre_ids.includes(16) && (item.origin_country || []).includes('JP'));
        return {
          id: item.id,
          title: item.title || item.name,
          type: isAnime ? 'anime' : (item.media_type || (item.title ? 'movie' : 'tv')),
          year: (item.release_date || item.first_air_date || '').substring(0, 4),
          rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 0,
          poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
          backdrop: item.backdrop_path ? `${BACKDROP_BASE_URL}${item.backdrop_path}` : null,
          overview: item.overview
        };
      });
  } catch (err) {
    console.error('TMDB Search Error:', err);
    return DEMO_MOVIES;
  }
}

export async function getTMDBDetails(id, mediaType) {
  const apiKey = CONFIG.TMDB_API_KEY;
  const isMovie = mediaType === 'movie';
  const typeParam = isMovie ? 'movie' : 'tv';

  if (!apiKey || apiKey === 'YOUR_TMDB_API_KEY') {
    const demo = DEMO_MOVIES.find(d => d.id == id) || DEMO_MOVIES[0];
    return {
      ...demo,
      genres: ['Sci-Fi', 'Action', 'Drama'],
      runtime: isMovie ? '2h 49m' : '24 eps',
      status: 'Released',
      whereToWatch: [
        { name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/9A1JSVmSxsWyoLFi2MsjWVoGJx1.jpg' },
        { name: 'Apple TV', logo: 'https://image.tmdb.org/t/p/w92/peAdQI13p14j61Rfdv970fP.jpg' }
      ],
      reviews: [
        { author: 'CinemaBuff99', content: 'Absolute masterpiece. Visuals and soundtrack are unmatched.' },
        { author: 'AnimeLover', content: 'Incredible storytelling and emotional pacing!' }
      ],
      recommendations: DEMO_MOVIES.slice(0, 3)
    };
  }

  try {
    const [detailsRes, appendRes, watchRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/${typeParam}/${id}?api_key=${apiKey}`),
      fetch(`${TMDB_BASE_URL}/${typeParam}/${id}?api_key=${apiKey}&append_to_response=videos,reviews,recommendations`),
      fetch(`${TMDB_BASE_URL}/${typeParam}/${id}/watch/providers?api_key=${apiKey}`)
    ]);

    const details = await detailsRes.json();
    const append = await appendRes.json();
    const watch = await watchRes.json();

    const watchUS = (watch.results && watch.results.US) || {};
    const flatrate = watchUS.flatrate || [];

    const trailer = (append.videos && append.videos.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');

    return {
      id: details.id,
      title: details.title || details.name,
      type: mediaType,
      year: (details.release_date || details.first_air_date || '').substring(0, 4),
      rating: details.vote_average ? Number(details.vote_average.toFixed(1)) : 0,
      poster: details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : null,
      backdrop: details.backdrop_path ? `${BACKDROP_BASE_URL}${details.backdrop_path}` : null,
      overview: details.overview,
      genres: (details.genres || []).map(g => g.name),
      runtime: isMovie ? (details.runtime ? `${details.runtime}m` : 'N/A') : `${details.number_of_episodes || '?'} eps`,
      trailerKey: trailer ? trailer.key : null,
      whereToWatch: flatrate.map(p => ({ name: p.provider_name, logo: `${IMAGE_BASE_URL}${p.logo_path}` })),
      reviews: (append.reviews && append.reviews.results || []).slice(0, 3).map(r => ({ author: r.author, content: r.content })),
      recommendations: (append.recommendations && append.recommendations.results || []).slice(0, 6).map(r => ({
        id: r.id,
        title: r.title || r.name,
        type: mediaType,
        poster: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
        rating: r.vote_average ? Number(r.vote_average.toFixed(1)) : 0
      }))
    };
  } catch (err) {
    console.error('TMDB Detail Error:', err);
    return null;
  }
}
