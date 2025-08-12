/**
 * Integration tests for Coqui TTS adapter
 * Tests for Task 8.4: TTS Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoquiAdapter, createCoquiAdapter } from '../../src/adapters/coqui';

// Mock fetch globally
global.fetch = vi.fn();

describe('CoquiAdapter', () => {
  let adapter: CoquiAdapter;
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new CoquiAdapter('http://localhost:5002', 'test-key');
  });

  describe('synthesize', () => {
    it('should synthesize text to speech successfully', async () => {
      const mockAudioData = new ArrayBuffer(1024);
      const mockResponse = {
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioData)
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const text = 'Hello, world!';
      const result = await adapter.synthesize(text, {
        voice: 'jenny',
        speed: 1.2,
        format: 'wav'
      });

      expect(result.audio).toBeInstanceOf(Buffer);
      expect(result.format).toBe('wav');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.sample_rate).toBe(22050);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/tts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key'
          }),
          body: expect.stringContaining('"text":"Hello, world!"')
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

      await expect(
        adapter.synthesize('Hello')
      ).rejects.toThrow('Coqui TTS error: 500 Internal Server Error');
    });

    it('should use default options when none provided', async () => {
      const mockAudioData = new ArrayBuffer(512);
      const mockResponse = {
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioData)
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await adapter.synthesize('Test text');

      expect(result.format).toBe('wav');
      expect(result.sample_rate).toBe(22050);
    });
  });

  describe('getVoices', () => {
    it('should return available voices from API', async () => {
      const mockVoices = [
        { id: 'jenny', name: 'Jenny', language: 'en', gender: 'female' },
        { id: 'ryan', name: 'Ryan', language: 'en', gender: 'male' }
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ voices: mockVoices })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const voices = await adapter.getVoices();

      expect(voices).toEqual(mockVoices);
      expect(voices).toHaveLength(2);
    });

    it('should return mock voices when API is unavailable', async () => {
      const mockResponse = {
        ok: false,
        status: 503
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const voices = await adapter.getVoices();

      expect(voices).toHaveLength(6); // Mock voices count
      expect(voices[0].id).toBe('jenny');
      expect(voices[1].id).toBe('ryan');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const voices = await adapter.getVoices();

      expect(voices).toHaveLength(6); // Should fall back to mock voices
    });
  });

  describe('cloneVoice', () => {
    it('should clone voice from audio sample', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          voice_id: 'cloned_custom_123',
          message: 'Voice cloned successfully'
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const audioSample = Buffer.from('fake audio data');
      const result = await adapter.cloneVoice(audioSample, 'custom');

      expect(result.voiceId).toBe('cloned_custom_123');
      expect(result.message).toBe('Voice cloned successfully');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/voices/clone',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          })
        })
      );
    });

    it('should handle cloning failures', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const audioSample = Buffer.from('invalid audio');

      await expect(
        adapter.cloneVoice(audioSample, 'custom')
      ).rejects.toThrow('Voice cloning failed: 400 Bad Request');
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
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const health = await adapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toBe('Connection refused');
    });
  });

  describe('streamSynthesize', () => {
    it('should stream synthesis for long text', async () => {
      const mockAudioData1 = new ArrayBuffer(512);
      const mockAudioData2 = new ArrayBuffer(512);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockAudioData1)
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockAudioData2)
        });

      const longText = 'First sentence. Second sentence!';
      const chunks: Buffer[] = [];

      for await (const chunk of adapter.streamSynthesize(longText)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBeInstanceOf(Buffer);
      expect(chunks[1]).toBeInstanceOf(Buffer);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle single sentence text', async () => {
      const mockAudioData = new ArrayBuffer(256);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioData)
      });

      const shortText = 'Short text without punctuation';
      const chunks: Buffer[] = [];

      for await (const chunk of adapter.streamSynthesize(shortText)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('factory function', () => {
    it('should create adapter with default settings', () => {
      const adapter = createCoquiAdapter();
      expect(adapter).toBeInstanceOf(CoquiAdapter);
    });

    it('should create adapter with custom settings', () => {
      const adapter = createCoquiAdapter('http://custom:5000', 'custom-key');
      expect(adapter).toBeInstanceOf(CoquiAdapter);
    });
  });
});
