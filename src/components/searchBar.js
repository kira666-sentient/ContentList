import { searchTMDB } from '../api/tmdb.js';
import { searchRAWG } from '../api/rawg.js';
import { searchBooks } from '../api/books.js';
import { searchMusic } from '../api/music.js';
import { searchPodcasts } from '../api/podcasts.js';

export function renderSearchBar(onResultsCallback) {
  const container = document.createElement('div');
  container.className = 'search-box-container';

  let currentCategory = 'all';
  let searchTimeout = null;

  container.innerHTML = `
    <div class="search-input-wrapper">
      <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input type="text" id="searchInput" class="search-input" placeholder="Search movies, anime, games, books, podcasts..." />
      <button id="clearSearchBtn" class="clear-btn" style="display: none;">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="category-tabs">
      <button class="tab-btn active" data-cat="all">✨ All</button>
      <button class="tab-btn" data-cat="movie">🎬 Movies</button>
      <button class="tab-btn" data-cat="tv">📺 TV</button>
      <button class="tab-btn" data-cat="anime">⛩️ Anime</button>
      <button class="tab-btn" data-cat="game">🎮 Games</button>
      <button class="tab-btn" data-cat="book">📚 Books</button>
      <button class="tab-btn" data-cat="music">🎵 Music</button>
      <button class="tab-btn" data-cat="podcast">🎙️ Podcasts</button>
    </div>
  `;

  const input = container.querySelector('#searchInput');
  const clearBtn = container.querySelector('#clearSearchBtn');
  const tabBtns = container.querySelectorAll('.tab-btn');

  const executeSearch = async () => {
    const query = input.value.trim();
    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    onResultsCallback(null, true); // trigger loading skeleton state

    try {
      let results = [];

      if (currentCategory === 'all') {
        const [tmdbRes, rawgRes, bookRes] = await Promise.all([
          searchTMDB(query, 'all'),
          searchRAWG(query),
          query ? searchBooks(query) : []
        ]);
        results = [...tmdbRes, ...rawgRes, ...bookRes];
      } else if (currentCategory === 'movie' || currentCategory === 'tv' || currentCategory === 'anime') {
        results = await searchTMDB(query, currentCategory);
      } else if (currentCategory === 'game') {
        results = await searchRAWG(query);
      } else if (currentCategory === 'book') {
        results = await searchBooks(query);
      } else if (currentCategory === 'music') {
        results = await searchMusic(query);
      } else if (currentCategory === 'podcast') {
        results = await searchPodcasts(query);
      }

      onResultsCallback(results, false);
    } catch (err) {
      console.error('Search Execution Error:', err);
      onResultsCallback([], false);
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(executeSearch, 350);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      executeSearch();
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      executeSearch();
    });
  });

  // Initial trigger
  setTimeout(executeSearch, 100);

  return container;
}
