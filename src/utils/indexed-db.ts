// src/utils/indexed-db.ts

import { logger } from "./logger";

const DB_NAME = "spell-check-cache";
const DB_VERSION = 1;
const DICTIONARY_STORE = "dictionaries";

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(DICTIONARY_STORE)) {
        dbInstance.createObjectStore(DICTIONARY_STORE);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      logger.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject("Error opening IndexedDB.");
    };
  });
}

export async function getCache<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICTIONARY_STORE], "readonly");
    const store = transaction.objectStore(DICTIONARY_STORE);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };

    request.onerror = (event) => {
      logger.error(`Error getting ${key} from cache:`, (event.target as IDBRequest).error);
      reject(`Error getting ${key} from cache.`);
    };
  });
}

export async function setCache(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICTIONARY_STORE], "readwrite");
    const store = transaction.objectStore(DICTIONARY_STORE);
    const request = store.put(value, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      logger.error(`Error setting ${key} in cache:`, (event.target as IDBRequest).error);
      reject(`Error setting ${key} in cache.`);
    };
  });
}
