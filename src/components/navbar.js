import { getCurrentUser, loginWithGoogle, logout } from '../auth/auth.js';
import { showToast } from './toast.js';

export function renderNavbar(activeRoute = 'home') {
  const user = getCurrentUser();

  const nav = document.createElement('header');
  nav.className = 'navbar';

  nav.innerHTML = `
    <div class="container navbar-inner ${user ? 'has-user' : ''}">
      <a href="#/" class="brand-logo">
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradNav" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#818cf8" />
              <stop offset="50%" stop-color="#6366f1" />
              <stop offset="100%" stop-color="#c084fc" />
            </linearGradient>
          </defs>
          <path d="M25 12h50a8 8 0 0 1 8 8v68a4 4 0 0 1-6.4 3.2L50 68 23.4 91.2A4 4 0 0 1 17 88V20a8 8 0 0 1 8-8z" fill="url(#gradNav)"/>
          <path d="M50 25l5 12 13 2-9.5 9 2.5 13L50 55l-11 6 2.5-13-9.5-9 13-2z" fill="#ffffff"/>
        </svg>
        <span>ContentList</span>
      </a>

      <nav class="nav-links">
        <a href="#/" class="nav-link ${activeRoute === 'home' ? 'active' : ''}">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          Explore
        </a>
        <a href="#/list" class="nav-link ${activeRoute === 'list' ? 'active' : ''}">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          My List
        </a>
      </nav>

      <div class="user-menu ${user ? 'logged-in' : ''}">
        ${user ? `
          <img src="${user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.displayName}" class="avatar" title="${user.displayName}" referrerpolicy="no-referrer" />
          <button id="logoutBtn" class="btn-secondary logout-btn" title="Logout">
            <span class="logout-text">Logout</span>
            <svg class="logout-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        ` : `
          <button id="loginBtn" class="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.761h-9.426z"/></svg>
            Sign in with Google
          </button>
        `}
      </div>
    </div>
  `;

  // Add Auth event handlers
  setTimeout(() => {
    const loginBtn = nav.querySelector('#loginBtn');
    const logoutBtn = nav.querySelector('#logoutBtn');

    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        try {
          await loginWithGoogle();
          showToast('Signed in successfully!', 'success');
          window.location.reload();
        } catch (err) {
          showToast('Sign in failed', 'error');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await logout();
        showToast('Signed out', 'info');
        window.location.reload();
      });
    }
  }, 0);

  return nav;
}
