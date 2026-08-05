import { renderNavbar } from '../components/navbar.js';
import { renderSearchBar } from '../components/searchBar.js';
import { renderDashboard } from '../components/dashboard.js';
import { createContentCard } from '../components/contentCard.js';
import { renderSkeletonGrid } from '../components/skeleton.js';
import { getCurrentUser } from '../auth/auth.js';
import { openCustomItemModal } from '../components/customItemModal.js';

export async function renderHomePage() {
  const page = document.createElement('div');

  page.appendChild(renderNavbar('home'));

  const main = document.createElement('main');
  main.className = 'main-content container';

  const hero = document.createElement('section');
  hero.className = 'hero-section';
  hero.innerHTML = `
    <h1 class="hero-title">Track Everything You Watch, Play & Read</h1>
    <p class="hero-subtitle">
      One sublime list synced across all your devices. Movies, TV shows, anime, games, books, music, and podcasts.
    </p>
  `;

  main.appendChild(hero);

  // Search Container
  const searchWrapper = document.createElement('div');
  hero.appendChild(searchWrapper);

  // Results / Dashboard Grid container
  const resultsContainer = document.createElement('div');
  resultsContainer.style.marginTop = '40px';
  main.appendChild(resultsContainer);

  let isInitialLoad = true;

  // Render search bar and handle results callback
  const searchBar = renderSearchBar((results, isLoading) => {
    resultsContainer.innerHTML = '';

    if (isLoading) {
      const skeletonGrid = document.createElement('div');
      skeletonGrid.className = 'content-grid';
      renderSkeletonGrid(skeletonGrid, 8);
      resultsContainer.appendChild(skeletonGrid);
      
      // Smoothly scroll down to results on smaller screens, but skip on initial page load
      if (window.innerWidth <= 640 && !isInitialLoad) {
        const offset = resultsContainer.getBoundingClientRect().top + window.scrollY - 180;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
      return;
    }

    isInitialLoad = false;

    if (!results || results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <h3>No results found</h3>
          <p>Try searching for a different title or select a specific category tab.</p>
          <button id="addCustomEmptyBtn" style="margin-top: 20px; padding: 12px 24px; border-radius: 8px; background: var(--primary-color); color: white; border: none; font-weight: 600; cursor: pointer; transition: 0.2s transform;">+ Add Custom Item</button>
        </div>
      `;
      const customBtn = resultsContainer.querySelector('#addCustomEmptyBtn');
      if (customBtn) customBtn.addEventListener('click', openCustomItemModal);
      return;
    }

    const gridHeader = document.createElement('div');
    gridHeader.className = 'section-header';
    gridHeader.innerHTML = `<h2 class="section-title">Search Results (${results.length})</h2>`;
    resultsContainer.appendChild(gridHeader);

    const grid = document.createElement('div');
    grid.className = 'content-grid';

    results.forEach(item => {
      grid.appendChild(createContentCard(item));
    });

    const addCustomCard = document.createElement('div');
    addCustomCard.className = 'content-card';
    addCustomCard.style.display = 'flex';
    addCustomCard.style.flexDirection = 'column';
    addCustomCard.style.alignItems = 'center';
    addCustomCard.style.justifyContent = 'center';
    addCustomCard.style.cursor = 'pointer';
    addCustomCard.style.background = 'rgba(255,255,255,0.02)';
    addCustomCard.style.border = '2px dashed rgba(255,255,255,0.1)';
    addCustomCard.style.minHeight = '300px';
    addCustomCard.innerHTML = `
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--text-secondary); margin-bottom: 16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      <h3 style="font-size: 1.1rem; color: var(--text-secondary); text-align: center; line-height: 1.4;">Can't find it?<br/>Add Custom Item</h3>
    `;
    addCustomCard.addEventListener('click', openCustomItemModal);
    grid.appendChild(addCustomCard);

    resultsContainer.appendChild(grid);
  });

  searchWrapper.appendChild(searchBar);

  const user = getCurrentUser();
  if (user) {
    const dashboardPlaceholder = document.createElement('div');
    dashboardPlaceholder.style.marginTop = '48px';
    // Add a loading skeleton or just leave empty while it loads
    dashboardPlaceholder.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading dashboard...</div>';
    main.appendChild(dashboardPlaceholder);

    // Load asynchronously so it doesn't block the page render
    renderDashboard().then(dashboardSection => {
      dashboardPlaceholder.innerHTML = '';
      dashboardPlaceholder.appendChild(dashboardSection);
    }).catch(err => {
      dashboardPlaceholder.innerHTML = '<div style="text-align: center; color: var(--status-dropped);">Failed to load dashboard</div>';
      console.error(err);
    });
  }

  page.appendChild(main);
  return page;
}
