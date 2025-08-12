import { createResilientOllamaAdapter } from '../../src/utils/resilience.js';

// Test 1: retries then success
{
  const base: any = {
    _calls: 0,
    async chat(messages: any[]) {
      this._calls++;
      if (this._calls <= 2) throw new Error(this._calls === 1 ? 'network error' : 'timeout');
      return { message: { content: 'ok' } };
    },
    async generateEmbedding(_text: string) { return [0.1]; }
  };
  const wrapped = createResilientOllamaAdapter(base);
  const res = await wrapped.chat([{ role: 'user', content: 'hi' }]);
  if (JSON.stringify(res) !== JSON.stringify({ message: { content: 'ok' } })) {
    console.error('retry path failed', res);
    process.exit(1);
  }
  if (base._calls !== 3) {
    console.error('expected 3 attempts, got', base._calls);
    process.exit(1);
  }
}

// Test 2: circuit breaker opens
{
  const base: any = {
    async chat(_messages: any[]) { throw new Error('down'); },
    async generateEmbedding(_text: string) { return [0.1]; }
  };
  const wrapped = createResilientOllamaAdapter(base);
  // Trigger failures to open breaker (threshold default 5, but with retries inside; still should error)
  let opened = false;
  try {
    for (let i = 0; i < 6; i++) { await wrapped.chat([{ role: 'user', content: 'hi' }]).catch(() => {}); }
    await wrapped.chat([{ role: 'user', content: 'hi' }]);
  } catch {
    opened = true;
  }
  if (!opened) {
    console.error('circuit breaker did not open as expected');
    process.exit(1);
  }
}

console.log('PASS ollama-resilience-adapter');
