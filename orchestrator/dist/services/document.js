export function createDocumentProcessor(env, deps) {
    const ollama = deps?.ollama;
    const db = deps?.db;
    function chunk(text) {
        if (!text)
            return [];
        // naive chunker by lines with max ~500 chars
        const rawLines = text.split(/\r?\n/);
        const linesWithIdx = rawLines.map((l, i) => ({ t: l.trim(), idx: i + 1 })).filter(x => x.t);
        const chunks = [];
        let cur = '';
        let from = 0;
        let to = 0;
        for (const { t, idx } of linesWithIdx) {
            const next = (cur ? cur + ' ' : '') + t;
            if (next.length > 500) {
                if (cur)
                    chunks.push({ text: cur, from, to });
                cur = t;
                from = idx;
                to = idx;
            }
            else {
                if (!cur)
                    from = idx;
                cur = next;
                to = idx;
            }
        }
        if (cur)
            chunks.push({ text: cur, from, to });
        return chunks;
    }
    return {
        async processDocument(payload) {
            const text = payload.text ?? '';
            const chunks = chunk(text);
            const docs = [];
            // Optionnel: statut de source (si db expose l'API)
            if (db?.updateSourceStatus && payload.sourceId) {
                try {
                    await db.updateSourceStatus(payload.sourceId, 'indexing');
                }
                catch { }
            }
            for (const c of chunks) {
                let embedding = [];
                if (env.OLLAMA_EMBED_MODEL && typeof ollama?.embeddings === 'function') {
                    try {
                        embedding = await ollama.embeddings(env.OLLAMA_EMBED_MODEL, c.text);
                    }
                    catch {
                        embedding = [];
                    }
                }
                docs.push({
                    text: c.text,
                    embedding,
                    metadata: {
                        notebook_id: payload.notebookId,
                        source_id: payload.sourceId,
                        loc: { lines: { from: c.from, to: c.to } }
                    }
                });
            }
            if (db?.upsertDocuments) {
                await db.upsertDocuments(docs);
            }
            if (db?.updateSourceStatus && payload.sourceId) {
                try {
                    await db.updateSourceStatus(payload.sourceId, 'ready');
                }
                catch { }
            }
        }
    };
}
