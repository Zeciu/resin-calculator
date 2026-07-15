const DB_NAME = "hfzwood-recent-project-handles";
const DB_VERSION = 1;
const STORE_NAME = "handles";

function openHandleDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "entryId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open handle store."));
  });
}

export function isFileSystemHandle(handle) {
  return Boolean(handle && typeof handle.getFile === "function");
}

/**
 * Ensures read permission on a stored File System Access handle before getFile().
 * When permission APIs are unavailable, returns true so existing getFile behavior is preserved.
 *
 * @param {unknown} handle
 * @returns {Promise<boolean>}
 */
async function ensureFileHandlePermission(handle, mode) {
  if (!isFileSystemHandle(handle)) {
    return false;
  }

  if (typeof handle.queryPermission !== "function") {
    return true;
  }

  try {
    const current = await handle.queryPermission({ mode });
    if (current === "granted") {
      return true;
    }

    if (typeof handle.requestPermission !== "function") {
      return false;
    }

    const requested = await handle.requestPermission({ mode });
    return requested === "granted";
  } catch {
    return false;
  }
}

export async function ensureFileHandleReadPermission(handle) {
  return ensureFileHandlePermission(handle, "read");
}

export async function ensureFileHandleWritePermission(handle) {
  return ensureFileHandlePermission(handle, "readwrite");
}

export async function storeRecentProjectHandle(entryId, handle) {
  if (!entryId || !isFileSystemHandle(handle)) {
    return;
  }

  const database = await openHandleDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ entryId, handle });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Could not store file handle."));
    });
  } finally {
    database.close();
  }
}

export async function getRecentProjectHandle(entryId) {
  if (!entryId) {
    return null;
  }

  try {
    const database = await openHandleDatabase();

    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(entryId);

        request.onsuccess = () => {
          const record = request.result;
          resolve(isFileSystemHandle(record?.handle) ? record.handle : null);
        };
        request.onerror = () => reject(request.error ?? new Error("Could not read file handle."));
      });
    } finally {
      database.close();
    }
  } catch {
    return null;
  }
}
