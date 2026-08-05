import { renderNavbar } from '../components/navbar.js';
import { getUserList } from '../db/firestore.js';
import { createContentCard } from '../components/contentCard.js';
import { renderSkeletonGrid } from '../components/skeleton.js';
import { openImportModal } from '../components/importModal.js';
import { getCurrentUser } from '../auth/auth.js';

export async function renderMyListPage() {
  const page = document.createElement('div');
  page.appendChild(renderNavbar('list'));

  const main = document.createElement('main');
  main.className = 'main-content container';

  const user = getCurrentUser();

  if (!user) {
    main.innerHTML = `
      <div class="empty-state" style="padding-top: 100px;">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        <h3>Sign In Required</h3>
        <p style="margin-bottom: 24px;">Please sign in with Google to view and sync your personal list across your phone, tablet, and computer.</p>
      </div>
    `;
    page.appendChild(main);
    return page;
  }

  main.innerHTML = `
    <div class="list-page-header">
      <div class="list-page-title">
        <h1 class="hero-title" style="font-size: 2rem; margin: 0;">My List</h1>
        <p class="list-sync-note">Synced to your account (${user.email || user.displayName})</p>
      </div>
      <div class="list-page-actions">
        <button id="mobileFilterBtn" class="btn-secondary mobile-filter-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
          Filters
        </button>
        <button id="importBtn" class="btn-secondary import-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          Import CSV
        </button>
      </div>
    </div>

    <!-- Filter & Sort Bar -->
    <div class="list-filter-backdrop"></div>
    <div class="list-filter-bar">
      <div class="filter-modal-header">
        <h3>Filters & Sort</h3>
        <button id="closeFilterBtn" class="modal-close-inline">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="list-filter-selects">
        <select id="typeFilter" class="form-select">
          <option value="all">✨ All Types</option>
          <option value="movie">🎬 Movies</option>
          <option value="tv">📺 TV Shows</option>
          <option value="anime">⛩️ Anime</option>
          <option value="game">🎮 Games</option>
          <option value="book">📚 Books</option>
          <option value="music">🎵 Music</option>
          <option value="podcast">🎙️ Podcasts</option>
        </select>

        <select id="statusFilter" class="form-select">
          <option value="all">🌟 All Statuses</option>
          <option value="plan">⏳ Plan to Watch/Play</option>
          <option value="progress">▶️ In Progress</option>
          <option value="hold">⏸️ On Hold</option>
          <option value="completed">✅ Completed</option>
          <option value="dropped">❌ Dropped</option>
          <option value="favorite">⭐ Favorites</option>
        </select>
      </div>

      <div class="list-sort-row">
        <span class="list-sort-label">Sort By:</span>
        <select id="sortFilter" class="form-select">
          <option value="updatedAt">Date Added</option>
          <option value="rating">Your Rating</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>
    </div>

    <div id="listGridContainer"></div>
  `;

  const importBtn = main.querySelector('#importBtn');
  const mobileFilterBtn = main.querySelector('#mobileFilterBtn');
  const filterBar = main.querySelector('.list-filter-bar');
  const filterBackdrop = main.querySelector('.list-filter-backdrop');
  const closeFilterBtn = main.querySelector('#closeFilterBtn');
  const typeFilter = main.querySelector('#typeFilter');
  const statusFilter = main.querySelector('#statusFilter');
  const sortFilter = main.querySelector('#sortFilter');
  const gridContainer = main.querySelector('#listGridContainer');

  const toggleFilters = () => {
    filterBar.classList.toggle('modal-open');
    filterBackdrop.classList.toggle('modal-open');
    if (filterBar.classList.contains('modal-open')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  if (mobileFilterBtn) mobileFilterBtn.onclick = toggleFilters;
  if (closeFilterBtn) closeFilterBtn.onclick = toggleFilters;
  if (filterBackdrop) filterBackdrop.onclick = toggleFilters;

  const loadList = async () => {
    gridContainer.innerHTML = '';
    const skeletonGrid = document.createElement('div');
    skeletonGrid.className = 'content-grid';
    renderSkeletonGrid(skeletonGrid, 6);
    gridContainer.appendChild(skeletonGrid);

    const items = await getUserList({
      type: typeFilter.value,
      status: statusFilter.value,
      sortBy: sortFilter.value
    });

    gridContainer.innerHTML = '';

    if (items.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <h3>Your list is empty</h3>
          <p>Search for movies, anime, or games and click "Add to My List" to populate your personal tracker.</p>
        </div>
      `;
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'content-grid';
    items.forEach(item => {
      grid.appendChild(createContentCard(item));
    });
    gridContainer.appendChild(grid);
  };

  typeFilter.onchange = loadList;
  statusFilter.onchange = loadList;
  sortFilter.onchange = loadList;

  if (importBtn) {
    importBtn.onclick = () => {
      openImportModal(() => loadList());
    };
  }

  loadList();

  page.appendChild(main);
  return page;
}
