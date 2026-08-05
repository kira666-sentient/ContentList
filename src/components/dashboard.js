import { getUserStats, getUserList } from '../db/firestore.js';
import { createContentCard } from './contentCard.js';

export async function renderDashboard() {
  const container = document.createElement('div');
  container.className = 'dashboard-container';

  const stats = await getUserStats();
  const inProgressItems = await getUserList({ status: 'progress' });

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">${stats.total}</span>
        <span class="stat-label">Total Saved Items</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${stats.inProgress}</span>
        <span class="stat-label">▶️ In Progress</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${stats.completed}</span>
        <span class="stat-label">✅ Completed</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${stats.favorites}</span>
        <span class="stat-label">⭐ Favorites</span>
      </div>
    </div>

    ${inProgressItems.length > 0 ? `
      <div class="section-header">
        <h2 class="section-title">
          <span>▶️ Continue Watching & Playing</span>
        </h2>
      </div>
      <div class="content-grid" id="continueGrid"></div>
    ` : ''}
  `;

  if (inProgressItems.length > 0) {
    setTimeout(() => {
      const continueGrid = container.querySelector('#continueGrid');
      if (continueGrid) {
        inProgressItems.slice(0, 6).forEach(item => {
          continueGrid.appendChild(createContentCard(item));
        });
      }
    }, 0);
  }

  return container;
}
