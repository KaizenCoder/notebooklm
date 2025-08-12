export function createJobs() {
    const q = [];
    function schedule() {
        // Simple micro-task scheduler
        queueMicrotask(async () => {
            const job = q.shift();
            if (!job)
                return;
            try {
                await job.run();
            }
            catch { /* swallow */ }
            if (q.length)
                schedule();
        });
    }
    return {
        add(name, handler, payload) {
            q.push({ name, run: async () => { await handler(payload); } });
            if (q.length === 1)
                schedule();
        },
        size() { return q.length; }
    };
}
