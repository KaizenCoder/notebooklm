export function createIdempotencyStore(ttlMs = 5 * 60 * 1000) {
    const store = new Map();
    function sweep() {
        const now = Date.now();
        for (const [k, v] of store.entries()) {
            if (now - v.ts > ttlMs)
                store.delete(k);
        }
    }
    return {
        begin(key) {
            sweep();
            if (store.has(key))
                return false;
            store.set(key, { done: false, ts: Date.now() });
            return true;
        },
        complete(key, response) {
            const cur = store.get(key) ?? { done: false, ts: Date.now() };
            store.set(key, { done: true, response: response ?? cur.response, ts: cur.ts });
        },
        get(key) {
            sweep();
            const cur = store.get(key);
            return cur?.response;
        },
        has(key) { sweep(); return store.has(key); }
    };
}
