/**
 * Test setup file for vitest
 */

import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Mock global fetch if not available
  if (!globalThis.fetch) {
    const { vi } = require('vitest');
    globalThis.fetch = vi.fn();
  }
});
