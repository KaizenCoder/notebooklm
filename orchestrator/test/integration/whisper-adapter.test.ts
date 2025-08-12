/**
 * Integration tests for Whisper ASR adapter
 * Tests for Task 8.3: ASR Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhisperAdapter, createWhisperAdapter } from '../../src/adapters/whisper';

// Mock fetch globally
global.fetch = vi.fn();

describe('WhisperAdapter', () => {
  let adapter: WhisperAdapter;
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new WhisperAdapter('http://localhost:9000', 'test-key');
  });

  describe('transcribe', () => {
    it('should transcribe audio buffer successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          text: 'Hello world',
          segments: [
            {
              start: 0,
              end: 2.5,
              text: 'Hello world',
              confidence: 0.98
            }
          ],
          language: 'en',
          duration: 2.5
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const audioBuffer = Buffer.from('fake audio data');
      const result = await adapter.transcribe(audioBuffer, {
        model: 'base',
        language: 'en'
      });

      expect(result.text).toBe('Hello world');
      expect(result.segments).toHaveLength(1);
      expect(result.language).toBe('en');
      expect(result.duration).toBe(2.5);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9000/v1/audio/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const audioBuffer = Buffer.from('fake audio data');

      await expect(
        adapter.transcribe(audioBuffer)
      ).rejects.toThrow('Whisper API error: 500 Internal Server Error');
    });

    it('should use default mock data when API response is minimal', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({})
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const audioBuffer = Buffer.from('fake audio data');
      const result = await adapter.transcribe(audioBuffer);

      expect(result.text).toContain('Mock transcription');
      expect(result.segments).toHaveLength(1);
      expect(result.language).toBe('en');
    });

    it('should handle custom options', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          text: 'Bonjour monde',
          language: 'fr'
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const audioBuffer = Buffer.from('fake audio data');
      const result = await adapter.transcribe(audioBuffer, {
        model: 'large',
        language: 'fr',
        temperature: 0.2,
        response_format: 'verbose_json'
      });

      expect(result.language).toBe('fr');
    });
  });

  describe('getModels', () => {
    it('should return available models from API', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'whisper-tiny', created: 1234567890, object: 'model' },
            { id: 'whisper-base', created: 1234567891, object: 'model' }
          ]
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const models = await adapter.getModels();

      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('whisper-tiny');
      expect(models[1].id).toBe('whisper-base');
    });

    it('should return mock models when API is unavailable', async () => {
      const mockResponse = {
        ok: false,
        status: 503
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const models = await adapter.getModels();

      expect(models).toHaveLength(5);
      expect(models.map(m => m.id)).toEqual([
        'whisper-tiny',
        'whisper-base',
        'whisper-small',
        'whisper-medium',
        'whisper-large'
      ]);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when API responds', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const health = await adapter.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details).toBeUndefined();
    });

    it('should return unhealthy status when API fails', async () => {
      const mockResponse = { ok: false, status: 503 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const health = await adapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toBe('HTTP 503');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const health = await adapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toBe('Network error');
    });
  });

  describe('factory function', () => {
    it('should create adapter with default settings', () => {
      const adapter = createWhisperAdapter();
      expect(adapter).toBeInstanceOf(WhisperAdapter);
    });

    it('should create adapter with custom settings', () => {
      const adapter = createWhisperAdapter('http://custom:8000', 'custom-key');
      expect(adapter).toBeInstanceOf(WhisperAdapter);
    });
  });
});
