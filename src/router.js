import { renderHomePage } from './pages/home.js';
import { renderMyListPage } from './pages/myList.js';
import { subscribeAuth, getCurrentUser } from './auth/auth.js';

const routes = {
  '/': renderHomePage,
  '/list': renderMyListPage
};

export function initRouter() {
  const app = document.getElementById('app');
  let lastRenderedHash = null;
  let lastUserId = undefined; // undefined means "not yet known"

  const handleRoute = async (forceRender = false) => {
    let hash = window.location.hash.slice(1) || '/';
    if (!routes[hash]) hash = '/';

    const currentUserId = getCurrentUser()?.uid ?? null;

    // Skip re-render if same route AND auth state hasn't changed
    if (!forceRender && hash === lastRenderedHash && currentUserId === lastUserId) {
      return;
    }

    lastRenderedHash = hash;
    lastUserId = currentUserId;

    app.innerHTML = '';
    const pageElement = await routes[hash]();
    app.appendChild(pageElement);
    window.scrollTo(0, 0);
  };

  window.addEventListener('hashchange', () => handleRoute(true));
  window.addEventListener('load', () => handleRoute(true));

  subscribeAuth(() => {
    handleRoute(false);
  });
}
