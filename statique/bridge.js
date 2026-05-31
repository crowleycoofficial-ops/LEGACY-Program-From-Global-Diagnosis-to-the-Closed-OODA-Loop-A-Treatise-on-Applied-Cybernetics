// bridge.js — Couche de stockage local (IndexedDB) et de communication inter-fenêtres
// Conçu pour les Chromebooks : zéro dépendance, persistant, offline, immédiat.

const DB_NAME = 'forgeron-souverain-db';
const DB_VERSION = 1;

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('index')) {
        db.createObjectStore('index', { keyPath: 'path' });
      }
      if (!db.objectStoreNames.contains('memory')) {
        db.createObjectStore('memory', { keyPath: 'term' });
      }
      if (!db.objectStoreNames.contains('telemetry')) {
        db.createObjectStore('telemetry', { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export const dbStore = {
  async get(storeName, key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(storeName) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, value) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// Bus de communication natif (sans serveur) – lie FORGERON et SENTINEL
export const localBus = new BroadcastChannel('forgeron-sentinel-bus');
