// import type { StorageProvider } from './storageService';

// const API_URL = 'http://localhost:3000/api/storage'; // Replace with your actual backend URL

// const getBackendValue = async (key: string): Promise<any | null> => {
//     try {
//         const response = await fetch(`${API_URL}/${key}`);
//         if (response.status === 404) return null;
//         if (!response.ok) throw new Error(`Backend GET failed: ${response.statusText}`);
//         return await response.json();
//     } catch (e) {
//         console.error(`Error reading from backend [${key}]:`, e);
//         return null;
//     }
// };

// const setBackendValue = async (key: string, value: any): Promise<void> => {
//     try {
//         const response = await fetch(`${API_URL}/${key}`, {
//             method: 'POST', // or 'PUT' depending on backend implementation
//             headers: { 'Content-Type': 'application/json' },
//             body: typeof value === 'string' ? value : JSON.stringify(value)
//         });
//         if (!response.ok) throw new Error(`Backend POST failed: ${response.statusText}`);
//     } catch (e) {
//         console.error(`Error writing to backend [${key}]:`, e);
//         throw e;
//     }
// };

// const removeBackendValue = async (key: string): Promise<void> => {
//     try {
//         const response = await fetch(`${API_URL}/${key}`, {
//             method: 'DELETE'
//         });
//         if (!response.ok && response.status !== 404) {
//             throw new Error(`Backend DELETE failed: ${response.statusText}`);
//         }
//     } catch (e) {
//         console.error(`Error removing from backend [${key}]:`, e);
//     }
// };

// export const backendProvider: StorageProvider = {
//     get: getBackendValue,
//     set: setBackendValue,
//     remove: removeBackendValue
// };