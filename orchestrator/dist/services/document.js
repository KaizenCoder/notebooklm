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
        // Build a token->line index to robustly map token ranges to line ranges
        const tokenLine = [];
        {
            let lineIdx = 1;
            for (const line of lines) {
                const lineTokens = line.split(/\s+/).filter(Boolean).length;
                for (let i = 0; i < lineTokens; i++)
                    tokenLine.push(lineIdx);
                lineIdx++;
            }
        }
        const chunks = [];
        let start = 0;
        while (start < tokens.length) {
            const end = Math.min(tokens.length, start + targetTokens);
            const sliceTokens = tokens.slice(start, end);
            const slice = sliceTokens.join(' ');
            const fromLine = tokenLine[start] ?? 1;
            const toLine = tokenLine[end - 1] ?? lines.length;
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
        if (params.sourceType === 'pdf' && params.fileUrl) {
            if (pdf?.extractText)
                return pdf.extractText(params.fileUrl);
            return `PDF text from ${params.fileUrl}`;
        }
        if (params.sourceType === 'audio' && params.fileUrl) {
            if (whisper?.transcribe)
                return whisper.transcribe(params.fileUrl);
            return `Audio text from ${params.fileUrl}`;
        }
        return '';
    }
    async function mapWithConcurrency(items, limit, mapper) {
        const results = new Array(items.length);
        let next = 0;
        let active = 0;
        return new Promise((resolve) => {
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
                        .catch(() => { results[currentIndex] = undefined; })
                        .finally(() => { active--; launchNext(); });
                }
            };
            launchNext();
        });
    }
    return {
        async processDocument(payload) {
            const t0 = Date.now();
            const tExtractStart = Date.now();
            const fullText = await loadTextFromSource({ text: payload.text, sourceType: payload.sourceType, fileUrl: payload.fileUrl });
            const tExtractEnd = Date.now();
            if (typeof console?.log === 'function') {
                console.log(JSON.stringify({ event: 'EXTRACT_COMPLETE', correlation_id: payload.correlationId ?? null, extract_duration_ms: tExtractEnd - tExtractStart }));
            }
            const chunks = chunkTokens(fullText);
            if (db?.updateSourceStatus && payload.sourceId) {
                try {
                    await db.updateSourceStatus(payload.sourceId, 'indexing');
                }
                catch { }
            }
            const tEmbedStart = Date.now();
            const embeddings = await mapWithConcurrency(chunks, 4, async (c) => {
                if (env.OLLAMA_EMBED_MODEL && typeof ollama?.embeddings === 'function') {
                    try {
                        const vec = await ollama.embeddings(env.OLLAMA_EMBED_MODEL, c.text);
                        // Enforce 768-dim embeddings (clone strict). If not compliant, throw to surface error.
                        if (Array.isArray(vec) && vec.length === 768)
                            return vec;
                        throw new Error(`Invalid embedding dims: ${Array.isArray(vec) ? vec.length : 'unknown'}`);
                    }
                    catch {
                        return [];
                    }
                }
                return [];
            });
            const t2 = Date.now();
            if (typeof console?.log === 'function') {
                console.log(JSON.stringify({ event: 'EMBED_COMPLETE', correlation_id: payload.correlationId ?? null, embed_duration_ms: t2 - tEmbedStart, chunks: chunks.length }));
            }
            const docs = chunks.map((c, i) => ({
                text: c.text,
                embedding: embeddings[i] ?? [],
                metadata: { notebook_id: payload.notebookId, source_id: payload.sourceId, loc: { lines: { from: c.from, to: c.to } } }
            }));
            if (typeof console?.log === 'function') {
                console.log(JSON.stringify({ event: 'UPSERT_START', correlation_id: payload.correlationId ?? null, count: docs.length }));
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
            const t3 = Date.now();
            if (typeof console?.log === 'function') {
                console.log(JSON.stringify({ event: 'UPSERT_COMPLETE', correlation_id: payload.correlationId ?? null, upsert_duration_ms: t3 - t2, count: docs.length }));
                console.log(JSON.stringify({
                    event: 'doc.processed', correlation_id: payload.correlationId ?? null,
                    timings_ms: { extract: tExtractEnd - tExtractStart, embed: t2 - tEmbedStart, upsert: t3 - t2, total: t3 - t0 },
                    chunks: chunks.length
                }));
            }
            return { chunks: docs.length };
        }
    };
}
