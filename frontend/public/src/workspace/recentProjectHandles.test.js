import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteRecentProjectHandle,
  getRecentProjectHandle,
  storeRecentProjectHandle,
} from "./recentProjectHandles.js";

function createFakeIndexedDB({ failOpen = false, failDelete = false } = {}) {
  const records = new Map();

  function createRequest(run) {
    const request = {
      result: undefined,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    queueMicrotask(() => {
      try {
        run(request);
      } catch (error) {
        request.error = error;
        request.onerror?.();
      }
    });

    return request;
  }

  return {
    records,
    open() {
      return createRequest((request) => {
        if (failOpen) {
          request.error = new Error("IndexedDB unavailable");
          request.onerror?.();
          return;
        }

        request.result = {
          objectStoreNames: { contains: () => true },
          close() {},
          transaction() {
            return {
              objectStore() {
                return {
                  put(record) {
                    return createRequest((putRequest) => {
                      records.set(record.entryId, record);
                      putRequest.onsuccess?.();
                    });
                  },
                  get(entryId) {
                    return createRequest((getRequest) => {
                      getRequest.result = records.get(entryId);
                      getRequest.onsuccess?.();
                    });
                  },
                  delete(entryId) {
                    return createRequest((deleteRequest) => {
                      if (failDelete) {
                        deleteRequest.error = new Error("Could not delete file handle.");
                        deleteRequest.onerror?.();
                        return;
                      }

                      records.delete(entryId);
                      deleteRequest.onsuccess?.();
                    });
                  },
                };
              },
            };
          },
        };

        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
    },
  };
}

function createHandle() {
  return {
    getFile: vi.fn(async () => new File(["{}"], "river-table.hfzproject")),
    remove: vi.fn(async () => {
      throw new Error("disk unlink should not be called");
    }),
  };
}

describe("recentProjectHandles delete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes the IndexedDB record for the given entry id", async () => {
    const indexedDB = createFakeIndexedDB();
    vi.stubGlobal("indexedDB", indexedDB);

    const handle = createHandle();
    await storeRecentProjectHandle("entry-1", handle);
    expect(await getRecentProjectHandle("entry-1")).toBe(handle);

    await deleteRecentProjectHandle("entry-1");

    expect(await getRecentProjectHandle("entry-1")).toBeNull();
    expect(indexedDB.records.has("entry-1")).toBe(false);
    expect(handle.remove).not.toHaveBeenCalled();
  });

  it("is safe when the IndexedDB record is missing", async () => {
    const indexedDB = createFakeIndexedDB();
    vi.stubGlobal("indexedDB", indexedDB);

    const handle = createHandle();
    await storeRecentProjectHandle("entry-1", handle);

    await expect(deleteRecentProjectHandle("missing-entry")).resolves.toBeUndefined();
    expect(await getRecentProjectHandle("entry-1")).toBe(handle);
    expect(handle.remove).not.toHaveBeenCalled();
  });

  it("does not throw when IndexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);

    await expect(deleteRecentProjectHandle("entry-1")).resolves.toBeUndefined();
  });

  it("does not throw when IndexedDB open fails", async () => {
    vi.stubGlobal("indexedDB", createFakeIndexedDB({ failOpen: true }));

    await expect(deleteRecentProjectHandle("entry-1")).resolves.toBeUndefined();
  });

  it("does not throw when IndexedDB delete fails", async () => {
    const indexedDB = createFakeIndexedDB({ failDelete: true });
    vi.stubGlobal("indexedDB", indexedDB);

    const handle = createHandle();
    await storeRecentProjectHandle("entry-1", handle);

    await expect(deleteRecentProjectHandle("entry-1")).resolves.toBeUndefined();
    expect(handle.remove).not.toHaveBeenCalled();
  });
});
