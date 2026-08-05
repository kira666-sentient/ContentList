import { saveContentItem } from '../db/firestore.js';
import { getCurrentUser } from '../auth/auth.js';
import { showToast } from './toast.js';
import { renderDashboard } from './dashboard.js';
import { generateCustomPlaceholder } from '../utils/placeholder.js';

let activeModal = null;

export function openCustomItemModal() {
  if (activeModal) activeModal.remove();

  const user = getCurrentUser();
  if (!user) {
    showToast('Please sign in to add custom items', 'error');
    return;
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  document.body.appendChild(backdrop);
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  activeModal = backdrop;

  backdrop.innerHTML = `
    <div class="modal-container" style="max-width: 500px; padding: 32px;">
      <button class="modal-close" id="closeCustomModalBtn">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <h2 style="margin-bottom: 24px; font-size: 1.5rem;">Add Custom Item</h2>
      
      <form id="customItemForm" style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 0.9rem;">Title</label>
          <input type="text" id="customTitle" required placeholder="e.g. Fortnite" style="width: 100%; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; font-size: 1rem; outline: none;" />
        </div>

        <div>
          <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 0.9rem;">Category</label>
          <select id="customType" style="width: 100%; padding: 12px; border-radius: 8px; background: #1a1e29; border: 1px solid rgba(255,255,255,0.1); color: white; font-size: 1rem; outline: none; appearance: none;">
            <option value="game">Game</option>
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
            <option value="anime">Anime</option>
            <option value="book">Book</option>
            <option value="podcast">Podcast</option>
            <option value="music">Music</option>
          </select>
        </div>

        <button type="submit" style="margin-top: 16px; padding: 14px; border-radius: 8px; background: var(--primary-color); color: white; border: none; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s;">
          Save to My List
        </button>
      </form>
    </div>
  `;

  setTimeout(() => backdrop.classList.add('open'), 10);

  const closeBtn = backdrop.querySelector('#closeCustomModalBtn');
  const form = backdrop.querySelector('#customItemForm');

  const closeModal = () => {
    backdrop.classList.remove('open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    setTimeout(() => backdrop.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = form.querySelector('#customTitle').value.trim();
    const type = form.querySelector('#customType').value;
    
    if (!title) return;

    const customId = 'custom_' + Date.now();
    
    const itemData = {
      id: customId,
      title: title,
      type: type,
      poster: generateCustomPlaceholder(title, type),
      year: new Date().getFullYear().toString(),
      status: 'plan'
    };

    try {
      await saveContentItem(itemData);
      showToast(`${title} added to your list!`, 'success');
      closeModal();
      
      // refresh the current view
      window.dispatchEvent(new Event('hashchange'));
    } catch (err) {
      console.error(err);
      showToast('Failed to save item', 'error');
    }
  });
}
