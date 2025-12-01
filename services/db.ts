
import { Track } from '../types';

const DB_NAME = 'SonicAlchemyDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllTracks = async (): Promise<Track[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const addTrackToDB = async (track: Track): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateTrackInDB = async (track: Track): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteTrackFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearDB = async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Backup & Restore
export const exportData = async (): Promise<string> => {
  const tracks = await getAllTracks();
  const backup = {
    version: 1,
    timestamp: Date.now(),
    tracks: tracks
  };
  return JSON.stringify(backup);
};

export const importData = async (jsonString: string): Promise<Track[]> => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tracks || !Array.isArray(data.tracks)) {
      throw new Error("Invalid backup format");
    }
    
    // Clear current DB and replace (or merge? replacing is safer for restore)
    // Let's clear first for a clean restore
    await clearDB();

    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Add all tracks
    for (const track of data.tracks) {
      store.add(track);
    }
    
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
             // Return tracks to update state immediately
             resolve(data.tracks);
        };
        transaction.onerror = () => reject(transaction.error);
    });

  } catch (e) {
    console.error("Import failed", e);
    throw e;
  }
};
