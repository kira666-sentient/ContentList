import { getTMDBDetails } from '../api/tmdb.js';
import { getRAWGDetails } from '../api/rawg.js';
import { getBookDetails } from '../api/books.js';
import { getMusicDetails } from '../api/music.js';
import { getPodcastDetails } from '../api/podcasts.js';
import { saveContentItem, removeContentItem, isItemSaved } from '../db/firestore.js';
import { generateCustomPlaceholder } from '../utils/placeholder.js';
import { getCurrentUser } from '../auth/auth.js';
import { showToast } from './toast.js';

let activeModal = null;

export async function openDetailModal(id, type) {
  if (activeModal) activeModal.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  document.body.appendChild(backdrop);
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  activeModal = backdrop;

  // Render skeleton inside modal while loading
  backdrop.innerHTML = `
    <div class="modal-container" style="padding: 40px; text-align: center;">
      <div class="skeleton" style="height: 200px; width: 100%; margin-bottom: 20px; border-radius: 12px;"></div>
      <div class="skeleton" style="height: 30px; width: 60%; margin: 0 auto 12px;"></div>
      <div class="skeleton" style="height: 16px; width: 80%; margin: 0 auto;"></div>
    </div>
  `;
  setTimeout(() => backdrop.classList.add('open'), 10);

  // Fetch detail based on content type
  let data = null;
  if (String(id).startsWith('custom_')) {
    const savedCustomRecord = await isItemSaved(type, id);
    if (savedCustomRecord) {
      data = {
        id: savedCustomRecord.originalId,
        title: savedCustomRecord.title,
        type: savedCustomRecord.type,
        poster: savedCustomRecord.poster,
        year: savedCustomRecord.year,
        overview: 'This is a custom item added by you. Since it was added manually, there are no extra details available from external databases.',
        rating: null,
        runtime: '',
        genres: ['Custom']
      };
    }
  } else if (type === 'movie' || type === 'tv' || type === 'anime') {
    data = await getTMDBDetails(id, type);
  } else if (type === 'game') {
    data = await getRAWGDetails(id);
  } else if (type === 'book') {
    data = await getBookDetails(id);
  } else if (type === 'music') {
    data = await getMusicDetails(id);
  } else if (type === 'podcast') {
    data = await getPodcastDetails(id);
  }

  if (!data) {
    showToast('Failed to load item details', 'error');
    backdrop.remove();
    return;
  }

  // Check if item is already in user's saved list
  const savedRecord = await isItemSaved(type, id);

  const backdropImg = data.backdrop || data.poster || 'https://via.placeholder.com/1200x500/12151c/64748b?text=ContentList';

  backdrop.innerHTML = `
    <div class="modal-container">
      <button class="modal-close" id="closeModalBtn">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <div class="detail-hero" style="background-image: url('${backdropImg}');">
        <div class="detail-hero-content">
          <img src="${data.poster}" class="detail-poster" alt="${data.title}" onerror="this.onerror=null; this.src='${data.fallbackPoster || generateCustomPlaceholder(data.title, data.type)}';" />
          <div class="detail-title-group">
            <h1>${data.title}</h1>
            <div class="detail-meta-pills">
              ${data.rating ? `<span class="meta-pill rating">★ ${data.rating}</span>` : ''}
              ${data.year ? `<span class="meta-pill">${data.year}</span>` : ''}
              <span class="meta-pill" style="text-transform: capitalize;">${data.type}</span>
              ${data.runtime ? `<span class="meta-pill">${data.runtime}</span>` : ''}
              ${data.pages ? `<span class="meta-pill">${data.pages}</span>` : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div>
          <h3 style="margin-bottom: 12px;">Overview</h3>
          <p class="overview-text">${data.overview || 'No description provided.'}</p>

          ${data.whereToWatch && data.whereToWatch.length > 0 ? `
            <div style="margin-bottom: 24px;">
              <h4 style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">Where to Watch</h4>
              <div class="provider-group">
                ${data.whereToWatch.map(p => `
                  <img src="${p.logo}" class="provider-logo" title="${p.name}" alt="${p.name}" />
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${data.genres && data.genres.length > 0 ? `
            <div style="margin-bottom: 24px;">
              <h4 style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">Genres</h4>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${data.genres.map(g => `<span class="meta-pill">${g}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${data.reviews && data.reviews.length > 0 ? `
            <div style="margin-top: 32px;">
              <h3 style="margin-bottom: 16px;">Reviews & Ratings</h3>
              ${data.reviews.map(r => `
                <div class="review-item">
                  <div class="review-author">${r.author}</div>
                  <div class="review-content">${r.content}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="action-panel">
          <h3 style="font-size: 1.1rem; margin-bottom: 4px;">Track & Save</h3>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modalStatusSelect" class="form-select">
              <option value="plan" ${savedRecord?.status === 'plan' ? 'selected' : ''}>⏳ Plan to Watch / Consuming</option>
              <option value="progress" ${savedRecord?.status === 'progress' ? 'selected' : ''}>▶️ In Progress</option>
              <option value="hold" ${savedRecord?.status === 'hold' ? 'selected' : ''}>⏸️ On Hold</option>
              <option value="completed" ${savedRecord?.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
              <option value="dropped" ${savedRecord?.status === 'dropped' ? 'selected' : ''}>❌ Dropped</option>
              <option value="favorite" ${savedRecord?.status === 'favorite' ? 'selected' : ''}>⭐ Favorites</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Your Personal Rating (1 - 10)</label>
            <input type="number" id="modalPersonalRating" class="form-input" min="1" max="10" placeholder="e.g. 9" value="${savedRecord?.personalRating || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">Personal Notes</label>
            <textarea id="modalNotes" class="form-textarea" placeholder="Jot down your thoughts, episode milestone, etc...">${savedRecord?.personalNotes || ''}</textarea>
          </div>

          <button id="saveItemBtn" class="btn-primary" style="width: 100%;">
            ${savedRecord ? 'Update Saved Item' : 'Add to My List'}
          </button>

          ${savedRecord ? `
            <button id="removeItemBtn" class="btn-secondary" style="width: 100%; color: var(--status-dropped); border-color: rgba(239, 68, 68, 0.3);">
              Remove from List
            </button>
          ` : ''}

          <button id="shareBtn" class="btn-secondary" style="width: 100%; margin-top: 8px;">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            Share This Item
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  backdrop.querySelector('#closeModalBtn').onclick = () => closeModal();
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };

  const saveBtn = backdrop.querySelector('#saveItemBtn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const user = getCurrentUser();
      if (!user) {
        showToast('Please sign in to save items to your list', 'info');
        return;
      }

      const status = backdrop.querySelector('#modalStatusSelect').value;
      const personalRating = Number(backdrop.querySelector('#modalPersonalRating').value) || 0;
      const personalNotes = backdrop.querySelector('#modalNotes').value;

      await saveContentItem({
        id: data.id,
        title: data.title,
        type: data.type,
        year: data.year,
        poster: data.poster,
        rating: data.rating,
        status,
        personalRating,
        personalNotes
      });

      showToast(`Saved "${data.title}" to your list!`, 'success');
      closeModal();
      window.dispatchEvent(new Event('hashchange'));
    };
  }

  const removeBtn = backdrop.querySelector('#removeItemBtn');
  if (removeBtn) {
    removeBtn.onclick = async () => {
      await removeContentItem(`${type}_${data.id}`);
      showToast(`Removed "${data.title}" from your list`, 'info');
      closeModal();
      window.dispatchEvent(new Event('hashchange'));
    };
  }

  const shareBtn = backdrop.querySelector('#shareBtn');
  if (shareBtn) {
    shareBtn.onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: data.title,
          text: `Check out ${data.title} on ContentList!`,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
      }
    };
  }
}

export function closeModal() {
  if (activeModal) {
    document.documentElement.style.overflow = 'scroll'; // Restore html scrollbar to prevent shift
    document.body.style.overflow = '';
    activeModal.classList.remove('open');
    setTimeout(() => {
      if (activeModal) activeModal.remove();
      activeModal = null;
    }, 250);
  }
}
