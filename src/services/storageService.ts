/**
 * Storage Service Abstraction
 * Supports multiple providers (LocalStorage, IndexedDB) with a unified
 * asynchronous interface that handles native objects.
 */
import * as storeNamesPkg from './storeNames'
const { OPENAI_API_CONFIG } = storeNamesPkg;

export interface StorageProvider {
    get(storeName: string, key: string | number): Promise<any | null>;
    create(storeName: string, value: any): Promise<number>;
    update(storeName: string, key: string | number, value: any): Promise<void>;
    getAll(storeName: string): Promise<any[]>;
    remove(storeName: string, key: string | number): Promise<void>;
}

const DB_NAME = 'JobAggregatorDB';
const DB_VERSION = 2;

const upgradeStrategy = (request: IDBOpenDBRequest) => {
    const db = request.result;
    Object.values(storeNamesPkg).forEach((name: string) => {
        if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, objectStoreSettings(name));
        }
    });
};

const objectStoreSettings = (storeName: string): IDBObjectStoreParameters => {
    switch (storeName) {
        case OPENAI_API_CONFIG:
            return {};
        default:
            return { keyPath: 'id', autoIncrement: true };
    }
}
const getIDBValue = (storeName: string, key: string | number): Promise<any | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => upgradeStrategy(request);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get(key);
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => resolve(getRequest.result ?? null);
        };
    });
};

const createIDBValue = (storeName: string, value: any): Promise<number> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => upgradeStrategy(request);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const putRequest = store.put(value);
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve(putRequest.result as number);
        };
    });
};

const updateIDBValue = (storeName: string, key: string | number, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => upgradeStrategy(request);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            if (store.keyPath && typeof store.keyPath === 'string') {
                value[store.keyPath] = key;
            }
            const putRequest = store.keyPath ? store.put(value) : store.put(value, key);
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve();
        };
    });
};

const removeIDBValue = (storeName: string, key: string | number): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => upgradeStrategy(request);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const deleteRequest = store.delete(key);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve();
        };
    });
};

const getAllIDBValues = (storeName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => upgradeStrategy(request);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            getAllRequest.onerror = () => reject(getAllRequest.error);
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        };
    });
};

const indexedDBProvider: StorageProvider = {
    get: getIDBValue,
    create: createIDBValue,
    update: updateIDBValue,
    remove: removeIDBValue,
    getAll: getAllIDBValues
};

// Toggle this to switch between providers!
export const storage = indexedDBProvider;

/**
 * Helper to get an object from storage with a default value.
 */
export async function getStorageObject(storeName: string, key: string | number): Promise<any> {
    const data = await storage.get(storeName, key);
    if (!data) return null;
    try {
        // If data is already an object (from native IDB) but contains Proxies, 
        // it might have been stringified for safety. 
        // If it's a string, parse it.
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        console.error(`Error parsing storage data for [${key}]:`, e);
        return null;
    }
}

/**
 * Helper to save an object to storage.
 * Stringifies data to strip Vue Proxies (deeply) for IndexedDB compatibility.
 */
// if you want to use a custom key, you could just call updateStorageObject directly... but I'll leave this since some code relies on this function.
export async function createStorageObject(storeName: string, value: any, key?: string | number): Promise<number> {
    return await storage.create(storeName, toPlainObject(value));
}

export async function updateStorageObject(storeName: string, key: string | number, value: any): Promise<void> {
    await storage.update(storeName, key, toPlainObject(value));
}

/**
 * Helper to remove an object from storage.
 */
export async function removeStorageObject(storeName: string, key: string | number): Promise<void> {
    await storage.remove(storeName, key);
}

/**
 * Helper to get all objects from storage.
 */
export async function getAllStorageObjects(storeName: string): Promise<any> {
    return await storage.getAll(storeName);
}

/**
 * Ensures data is a plain object by stripping Vue reactivity wrappers.
 */
function toPlainObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}