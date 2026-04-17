
import { WeightLog, PhotoEntry } from '../types';

const DB_NAME = 'morphscale_db';
const DB_VERSION = 1;

export class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => reject(event);
    });
  }

  async saveLog(log: WeightLog): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('logs', 'readwrite');
    tx.objectStore('logs').put(log);
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  }

  async getAllLogs(): Promise<WeightLog[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('logs', 'readonly');
    const store = tx.objectStore('logs');
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const sorted = (request.result as WeightLog[]).sort((a, b) => b.date - a.date);
        resolve(sorted);
      };
    });
  }

  async savePhoto(photo: PhotoEntry): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(photo);
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  }

  async getPhoto(id: string): Promise<PhotoEntry | undefined> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    const request = store.get(id);
    return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
  }

  async deleteLog(id: string, photoId?: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['logs', 'photos'], 'readwrite');
    tx.objectStore('logs').delete(id);
    if (photoId) {
      tx.objectStore('photos').delete(photoId);
    }
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['logs', 'photos'], 'readwrite');
    tx.objectStore('logs').clear();
    tx.objectStore('photos').clear();
    return new Promise((resolve) => (tx.oncomplete = () => resolve()));
  }
}

export const dbService = new StorageService();
