import { openDetailModal } from './contentDetail.js';
import { generateCustomPlaceholder } from '../utils/placeholder.js';

export function createContentCard(item) {
  const card = document.createElement('div');
  card.className = 'content-card';

  const posterSrc = item.poster || 'https://via.placeholder.com/300x450/1a1e29/64748b?text=No+Cover';
  
  const typeIcons = {
    movie: '🎬 Movie',
    tv: '📺 TV',
    anime: '⛩️ Anime',
    game: '🎮 Game',
    book: '📚 Book',
    music: '🎵 Music',
    podcast: '🎙️ Podcast'
  };

  const statusLabels = {
    plan: '⏳ Plan',
    progress: '▶️ In Progress',
    hold: '⏸️ On Hold',
    completed: '✅ Completed',
    dropped: '❌ Dropped',
    favorite: '⭐ Favorite'
  };

  card.innerHTML = `
    <div class="card-media">
      <img src="${posterSrc}" alt="${item.title}" class="card-img" loading="lazy" onerror="this.onerror=null; this.src='${item.fallbackPoster || generateCustomPlaceholder(item.title, item.type)}';" />
      <span class="type-pill">${typeIcons[item.type] || item.type}</span>
      ${item.rating ? `<span class="card-badge">★ ${item.rating}</span>` : ''}
    </div>
    <div class="card-body">
      <div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-subtitle">${item.year || ''} ${item.author || item.artist || ''}</p>
      </div>
      ${item.status ? `
        <div class="card-status-bar">
          <span class="status-badge ${item.status}">
            ${statusLabels[item.status] || item.status}
          </span>
          ${item.personalRating ? `<span style="font-size:0.8rem; font-weight:700; color:var(--text-accent);">Your rating: ${item.personalRating}/10</span>` : ''}
        </div>
      ` : ''}
    </div>
  `;

  card.addEventListener('click', () => {
    openDetailModal(item.originalId || item.id, item.type);
  });

  return card;
}
