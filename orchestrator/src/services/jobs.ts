export type JobHandler<T> = (payload: T) => Promise<void> | void;

export function createJobs() {
  type AnyJob = { name: string; run: () => Promise<void> };
  const q: AnyJob[] = [];

  function schedule() {
    // Simple micro-task scheduler
    queueMicrotask(async () => {
      const job = q.shift();
      if (!job) return;
      try { await job.run(); } catch { /* swallow */ }
      if (q.length) schedule();
    });
  }

  return {
    add<T>(name: string, handler: JobHandler<T>, payload: T) {
      q.push({ name, run: async () => { await handler(payload); } });
      if (q.length === 1) schedule();
    },
    size() { return q.length; }
  };
}

export type Jobs = ReturnType<typeof createJobs>;
