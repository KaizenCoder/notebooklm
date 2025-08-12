/**
 * Whisper ASR (Automatic Speech Recognition) Adapter
 * Mock implementation for Task 8.3: ASR Integration
 */

export interface WhisperTranscription {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence?: number;
  }>;
  language: string;
  duration: number;
}

export interface WhisperOptions {
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language?: string;
  temperature?: number;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export class WhisperAdapter {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl = 'http://localhost:9000', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Transcribe audio file to text using Whisper
   */
  async transcribe(
    audioBuffer: Buffer | string,
    options: WhisperOptions = {}
  ): Promise<WhisperTranscription> {
    const formData = new FormData();
    
    // Handle audio input
    if (typeof audioBuffer === 'string') {
      // Assume it's a file path
      const fs = await import('fs/promises');
      const fileBuffer = await fs.readFile(audioBuffer);
      formData.append('file', new Blob([new Uint8Array(fileBuffer)]), 'audio.wav');
    } else {
      formData.append('file', new Blob([new Uint8Array(audioBuffer)]), 'audio.wav');
    }

    // Add options to form data
    if (options.model) formData.append('model', options.model);
    if (options.language) formData.append('language', options.language);
    if (options.temperature) formData.append('temperature', options.temperature.toString());
    if (options.response_format) formData.append('response_format', options.response_format);

    const response = await fetch(`${this.baseUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // For now, return mock data structure
    // In real implementation, this would parse the actual Whisper response
    return {
      text: result.text || "Mock transcription: This is a sample transcription from audio input.",
      segments: result.segments || [
        {
          start: 0,
          end: 5.5,
          text: "Mock transcription: This is a sample transcription from audio input.",
          confidence: 0.95
        }
      ],
      language: result.language || options.language || 'en',
      duration: result.duration || 5.5
    };
  }

  /**
   * Get available Whisper models
   */
  async getModels(): Promise<Array<{ id: string; created: number; object: string }>> {
    const response = await fetch(`${this.baseUrl}/v1/models`, {
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      }
    });

    if (!response.ok) {
      // Return mock models if API not available
      return [
        { id: 'whisper-tiny', created: Date.now(), object: 'model' },
        { id: 'whisper-base', created: Date.now(), object: 'model' },
        { id: 'whisper-small', created: Date.now(), object: 'model' },
        { id: 'whisper-medium', created: Date.now(), object: 'model' },
        { id: 'whisper-large', created: Date.now(), object: 'model' }
      ];
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Health check for Whisper service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        }
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        details: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Factory function for creating resilient Whisper adapter
export function createWhisperAdapter(baseUrl?: string, apiKey?: string): WhisperAdapter {
  return new WhisperAdapter(baseUrl, apiKey);
}
