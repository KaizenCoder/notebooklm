export function createDocumentProcessor(env, deps) {
    const ollama = deps?.ollama;
    const db = deps?.db;
    const storage = deps?.storage;
    const pdf = deps?.pdf;
    const whisper = deps?.whisper;
    function tokenizeWords(text) {
        return text.split(/\s+/).filter(Boolean);
    }
    // chunk ~200 tokens with 40 tokens overlap
    function chunkTokens(text, targetTokens = 200, overlapTokens = 40) {
        const lines = text.split(/\r?\n/);
        const tokens = tokenizeWords(text);
        if (tokens.length === 0)
            return [];
        const chunks = [];
        let start = 0;
        while (start < tokens.length) {
            const end = Math.min(tokens.length, start + targetTokens);
            const slice = tokens.slice(start, end).join(' ');
            // approximate line mapping by scanning cumulative lengths
            const cumulative = [];
            let acc = 0;
            for (const l of lines) {
                acc += l.length + 1;
                cumulative.push(acc);
            }
            const globalText = text;
            const pos = globalText.indexOf(slice);
            let fromLine = 1, toLine = lines.length;
            if (pos >= 0) {
                for (let i = 0; i < cumulative.length; i++) {
                    if (cumulative[i] >= pos + 1) {
                        fromLine = i + 1;
                        break;
                    }
                }
                const posEnd = pos + slice.length;
                for (let i = 0; i < cumulative.length; i++) {
                    if (cumulative[i] >= posEnd) {
                        toLine = i + 1;
                        break;
                    }
                }
            }
            chunks.push({ text: slice, from: fromLine, to: toLine });
            if (end === tokens.length)
                break;
            start = Math.max(0, end - overlapTokens);
        }
        return chunks;
    }
    async function loadTextFromSource(params) {
        if (params.text)
            return params.text;
        if (params.sourceType === 'txt' && params.fileUrl && storage?.fetchText)
            return storage.fetchText(params.fileUrl);
        if (params.sourceType === 'pdf' && params.fileUrl && pdf?.extractText)
            return pdf.extractText(params.fileUrl);
        if (params.sourceType === 'audio' && params.fileUrl && whisper?.transcribe)
            return whisper.transcribe(params.fileUrl);
        return '';
    }
    async function mapWithConcurrency(items, limit, mapper) {
        const results = new Array(items.length);
        let next = 0;
        let active = 0;
        return new Promise((resolve, reject) => {
            const launchNext = () => {
                if (next >= items.length && active === 0) {
                    resolve(results);
                    return;
                }
                while (active < limit && next < items.length) {
                    const currentIndex = next++;
                    active++;
                    mapper(items[currentIndex], currentIndex)
                        .then((res) => { results[currentIndex] = res; })
                        .catch((_e) => { /* swallow per-chunk embedding errors */ results[currentIndex] = undefined; })
                        .finally(() => { active--; launchNext(); });
                }
            };
            launchNext();
        });
    }
    return {
        async processDocument(payload) {
            const t0 = Date.now();
            const fullText = await loadTextFromSource({ text: payload.text, sourceType: payload.sourceType, fileUrl: payload.fileUrl });
            const t1 = Date.now();
            const chunks = chunkTokens(fullText);
            if (db?.updateSourceStatus && payload.sourceId) {
                try {
                    await db.updateSourceStatus(payload.sourceId, 'indexing');
                }
                catch { }
            }
            const embeddings = await mapWithConcurrency(chunks, 4, async (c) => {
                if (env.OLLAMA_EMBED_MODEL && typeof ollama?.embeddings === 'function') {
                    try {
                        return await ollama.embeddings(env.OLLAMA_EMBED_MODEL, c.text);
                    }
                    catch {
                        return [];
                    }
                }
                return [];
            });
            const t2 = Date.now();
            const docs = chunks.map((c, i) => ({
                text: c.text,
                embedding: embeddings[i] ?? [],
                metadata: { notebook_id: payload.notebookId, source_id: payload.sourceId, loc: { lines: { from: c.from, to: c.to } } }
            }));
            if (db?.upsertDocuments) {
                await db.upsertDocuments(docs);
            }
            if (db?.updateSourceStatus && payload.sourceId) {
                try {
                    await db.updateSourceStatus(payload.sourceId, 'ready');
                }
                catch { }
            }
            const t3 = Date.now();
            if (typeof console?.log === 'function') {
                console.log(JSON.stringify({
                    event: 'doc.processed', correlation_id: payload.correlationId ?? null,
                    timings_ms: { load: t1 - t0, embed: t2 - t1, upsert: t3 - t2, total: t3 - t0 },
                    chunks: chunks.length
                }));
            }
            return { chunks: docs.length };
        }
    };
}
