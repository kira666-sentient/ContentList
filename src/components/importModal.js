import { importCSVData } from '../db/firestore.js';
import { showToast } from './toast.js';

export function openImportModal(onSuccessCallback) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop open';

  backdrop.innerHTML = `
    <div class="modal-container" style="max-width: 500px; padding: 32px;">
      <button class="modal-close" id="closeImportBtn">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Import from CSV</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px;">
        Upload a CSV file containing your content (Letterboxd, MyAnimeList, or custom CSV with columns: Title, Category, Status, Rating).
      </p>

      <div style="border: 2px dashed var(--border-subtle); border-radius: var(--radius-md); padding: 32px; text-align: center; margin-bottom: 24px; cursor: pointer;" id="dropZone">
        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--text-muted); margin-bottom: 8px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px;">Click to upload CSV file</div>
        <div style="color: var(--text-muted); font-size: 0.8rem;">Supports .csv text format</div>
        <input type="file" id="csvFileInput" accept=".csv" style="display: none;" />
      </div>

      <button id="confirmImportBtn" class="btn-primary" style="width: 100%;" disabled>Import Content</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const closeBtn = backdrop.querySelector('#closeImportBtn');
  const dropZone = backdrop.querySelector('#dropZone');
  const fileInput = backdrop.querySelector('#csvFileInput');
  const confirmBtn = backdrop.querySelector('#confirmImportBtn');

  let selectedFileContent = null;

  const closeImportModal = () => {
    document.documentElement.style.overflow = 'scroll';
    document.body.style.overflow = '';
    backdrop.remove();
  };

  closeBtn.onclick = closeImportModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeImportModal(); };

  dropZone.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedFileContent = event.target.result;
        confirmBtn.removeAttribute('disabled');
        dropZone.querySelector('div').textContent = `File selected: ${file.name}`;
      };
      reader.readAsText(file);
    }
  };

  confirmBtn.onclick = async () => {
    if (!selectedFileContent) return;
    try {
      const count = await importCSVData(selectedFileContent);
      showToast(`Successfully imported ${count} items!`, 'success');
      closeImportModal();
      if (onSuccessCallback) onSuccessCallback();
    } catch (err) {
      showToast('Import failed. Please check CSV format.', 'error');
    }
  };
}
