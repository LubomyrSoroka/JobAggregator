/**
 * Storage Service Abstraction
 * Supports multiple providers (LocalStorage, IndexedDB) with a unified
 * asynchronous interface that handles native objects.
 */

export interface StorageProvider {
    get(key: string): Promise<any | null>;
    set(key: string, value: any): Promise<void>;
    remove(key: string): Promise<void>;
}

const localStorageProvider: StorageProvider = {
    get: async (key: string) => {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error(`Error reading/parsing from localStorage [${key}]:`, e);
            return null;
        }
    },
    set: async (key: string, value: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error writing to localStorage [${key}]:`, e);
            throw e;
        }
    },
    remove: async (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Error removing from localStorage [${key}]:`, e);
        }
    }
};

const DB_NAME = 'JobHunterDB';
const STORE_NAME = 'keyvalue';

const getIDBValue = (key: string): Promise<any | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(key);
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => resolve(getRequest.result ?? null);
        };
    });
};

const setIDBValue = (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const putRequest = store.put(value, key);
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve();
        };
    });
};

const removeIDBValue = (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const deleteRequest = store.delete(key);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve();
        };
    });
};

const indexedDBProvider: StorageProvider = {
    get: getIDBValue,
    set: setIDBValue,
    remove: removeIDBValue
};

// Toggle this to switch between providers!
export const storage = indexedDBProvider;

/**
 * Helper to get an object from storage with a default value.
 */
export async function getStorageObject<T>(key: string, defaultValue: T): Promise<T> {
    const data = await storage.get(key);
    if (!data) return defaultValue;
    try {
        // If data is already an object (from native IDB) but contains Proxies, 
        // it might have been stringified for safety. 
        // If it's a string, parse it.
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        console.error(`Error parsing storage data for [${key}]:`, e);
        return defaultValue;
    }
}

/**
 * Helper to save an object to storage.
 * Stringifies data to strip Vue Proxies (deeply) for IndexedDB compatibility.
 */
export async function setStorageObject<T>(key: string, value: T): Promise<void> {
    await storage.set(key, JSON.stringify(toPlainObject(value)));
}

/**
 * Helper to remove an object from storage.
 */
export async function removeStorageObject(key: string): Promise<void> {
    await storage.remove(key);
}

/**
 * Ensures data is a plain object by stripping Vue reactivity wrappers.
 */
function toPlainObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}