
const DB_NAME = 'fshare-db';
const DB_VERSION = 1;

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  role: 'host' | 'joiner';
  addedAt: number;
}

export interface FileChunk {
  fileId: string;
  index: number;
  data: ArrayBuffer;
}

export class FShareDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { 
            keyPath: ['fileId', 'index'] 
          });
          chunkStore.createIndex('fileId', 'fileId', { unique: false });
        }
      };
    });
  }

  async saveFileMetadata(meta: FileMetadata): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.put(meta);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveChunk(chunk: FileChunk): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readwrite');
      const store = transaction.objectStore('chunks');
      const request = store.put(chunk);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFilesByRole(role: 'host' | 'joiner'): Promise<FileMetadata[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();
      request.onsuccess = () => {
        const allFiles = request.result as FileMetadata[];
        resolve(allFiles.filter(f => f.role === role).sort((a, b) => b.addedAt - a.addedAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getChunks(fileId: string): Promise<ArrayBuffer[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readonly');
      const store = transaction.objectStore('chunks');
      const index = store.index('fileId');
      const request = index.getAll(fileId);
      
      request.onsuccess = () => {
        const chunks = request.result as FileChunk[];
        // Sort by index to ensure correct order
        chunks.sort((a, b) => a.index - b.index);
        resolve(chunks.map(c => c.data));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files', 'chunks'], 'readwrite');
      
      const fileStore = transaction.objectStore('files');
      fileStore.delete(fileId);

      const chunkStore = transaction.objectStore('chunks');
      const index = chunkStore.index('fileId');
      const request = index.openKeyCursor(IDBKeyRange.only(fileId));
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          chunkStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files', 'chunks'], 'readwrite');
      transaction.objectStore('files').clear();
      transaction.objectStore('chunks').clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getFileBlob(fileId: string, type: string): Promise<Blob> {
    const chunks = await this.getChunks(fileId);
    return new Blob(chunks, { type });
  }
}

export const db = new FShareDB();
