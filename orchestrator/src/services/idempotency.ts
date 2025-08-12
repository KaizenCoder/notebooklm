export type StoredResponse = { statusCode: number; body: any };

export function createIdempotencyStore(ttlMs: number = 5 * 60 * 1000) {
  type Entry = { done: boolean; response?: StoredResponse; ts: number };
  const store = new Map<string, Entry>();

  function sweep() {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now - v.ts > ttlMs) store.delete(k);
    }
  }

  return {
    begin(key: string): boolean {
      sweep();
      if (store.has(key)) return false;
      store.set(key, { done: false, ts: Date.now() });
      return true;
    },
    complete(key: string, response?: StoredResponse) {
      const cur = store.get(key) ?? { done: false, ts: Date.now() };
      store.set(key, { done: true, response: response ?? cur.response, ts: cur.ts });
    },
    get(key: string): StoredResponse | undefined {
      sweep();
      const cur = store.get(key);
      return cur?.response;
    },
    has(key: string): boolean { sweep(); return store.has(key); }
  };
}

export type IdempotencyStore = ReturnType<typeof createIdempotencyStore>;
