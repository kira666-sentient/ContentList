import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { getCurrentUser, isFirebaseConfigured } from '../auth/auth.js';
import { CONFIG } from '../config.js';
import { initializeApp, getApps } from 'firebase/app';

let db = null;
if (isFirebaseConfigured()) {
  const app = getApps()[0];
  db = getFirestore(app);
}

const LOCAL_STORAGE_KEY = 'contentlist_saved_items';

function getLocalItems() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
}

function saveLocalItems(items) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

export async function saveContentItem(item) {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in');

  const itemData = {
    id: item.exactId || `${item.type}_${item.id}`,
    originalId: item.id,
    title: item.title,
    type: item.type,
    year: item.year || '',
    poster: item.poster || '',
    rating: item.rating || 0,
    status: item.status || 'plan', // plan, progress, hold, completed, dropped, favorite
    personalRating: item.personalRating || 0, // 1-10
    personalNotes: item.personalNotes || '',
    progress: item.progress || { current: 0, total: item.runtime || '' },
    updatedAt: new Date().toISOString()
  };

  if (db && user.uid !== 'demo_user_123') {
    const docRef = doc(db, 'users', user.uid, 'contentList', itemData.id);
    await setDoc(docRef, itemData, { merge: true });
  } else {
    const items = getLocalItems();
    const existingIndex = items.findIndex(i => i.id === itemData.id);
    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], ...itemData };
    } else {
      items.push(itemData);
    }
    saveLocalItems(items);
  }

  return itemData;
}

export async function removeContentItem(itemId) {
  const user = getCurrentUser();
  if (!user) return;

  if (db && user.uid !== 'demo_user_123') {
    const docRef = doc(db, 'users', user.uid, 'contentList', itemId);
    await deleteDoc(docRef);
  } else {
    const items = getLocalItems().filter(i => i.id !== itemId);
    saveLocalItems(items);
  }
}

export async function getUserList(filters = {}) {
  const user = getCurrentUser();
  if (!user) return [];

  let items = [];
  if (db && user.uid !== 'demo_user_123') {
    const listRef = collection(db, 'users', user.uid, 'contentList');
    const snapshot = await getDocs(listRef);
    items = snapshot.docs.map(doc => doc.data());
  } else {
    items = getLocalItems();
  }

  // Apply filters
  if (filters.type && filters.type !== 'all') {
    items = items.filter(i => i.type === filters.type);
  }
  if (filters.status && filters.status !== 'all') {
    items = items.filter(i => i.status === filters.status);
  }

  // Apply sorting
  if (filters.sortBy === 'rating') {
    items.sort((a, b) => (b.personalRating || b.rating) - (a.personalRating || a.rating));
  } else if (filters.sortBy === 'title') {
    items.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // Default by updatedAt
    items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return items;
}

export async function isItemSaved(type, originalId) {
  const user = getCurrentUser();
  if (!user) return null;
  const items = await getUserList();
  return items.find(i => i.originalId == originalId && i.type === type) || null;
}

export async function getUserStats() {
  const items = await getUserList();
  const stats = {
    total: items.length,
    movies: items.filter(i => i.type === 'movie').length,
    tv: items.filter(i => i.type === 'tv').length,
    anime: items.filter(i => i.type === 'anime').length,
    games: items.filter(i => i.type === 'game').length,
    books: items.filter(i => i.type === 'book').length,
    music: items.filter(i => i.type === 'music').length,
    podcasts: items.filter(i => i.type === 'podcast').length,
    inProgress: items.filter(i => i.status === 'progress').length,
    completed: items.filter(i => i.status === 'completed').length,
    favorites: items.filter(i => i.status === 'favorite').length
  };
  return stats;
}

export async function importCSVData(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return 0;
  
  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols[0]) {
      await saveContentItem({
        id: `custom_${Date.now()}_${i}`,
        title: cols[0],
        type: cols[1] || 'movie',
        status: cols[2] || 'plan',
        personalRating: Number(cols[3]) || 0
      });
      count++;
    }
  }
  return count;
}
