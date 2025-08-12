/**
 * Coqui TTS (Text-to-Speech) Adapter
 * Mock implementation for Task 8.4: TTS Integration
 */

export interface CoquiVoice {
  id: string;
  name: string;
  language: string;
  speaker?: string;
  gender?: 'male' | 'female';
}

export interface CoquiSynthesisOptions {
  voice?: string;
  speaker?: string;
  speed?: number; // 0.5 to 2.0
  pitch?: number; // -20 to 20 semitones
  volume?: number; // 0.0 to 1.0
  format?: 'wav' | 'mp3' | 'ogg';
  sample_rate?: number;
}

export interface CoquiSynthesisResult {
  audio: Buffer;
  format: string;
  duration: number;
  sample_rate: number;
}

export class CoquiAdapter {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl = 'http://localhost:5002', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Synthesize speech from text using Coqui TTS
   */
  async synthesize(
    text: string,
    options: CoquiSynthesisOptions = {}
  ): Promise<CoquiSynthesisResult> {
    const payload = {
      text,
      voice: options.voice || 'default',
      speaker: options.speaker,
      speed: options.speed || 1.0,
      pitch: options.pitch || 0,
      volume: options.volume || 1.0,
      format: options.format || 'wav',
      sample_rate: options.sample_rate || 22050
    };

    const response = await fetch(`${this.baseUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Coqui TTS error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    // For now, return mock result
    // In real implementation, extract actual metadata from response headers
    return {
      audio: audioBuffer,
      format: payload.format,
      duration: Math.max(1, text.length / 10), // Rough estimate: 10 chars per second
      sample_rate: payload.sample_rate
    };
  }

  /**
   * Get available voices from Coqui TTS
   */
  async getVoices(): Promise<CoquiVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/voices`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        }
      });

      if (!response.ok) {
        // Return mock voices if API not available
        return this.getMockVoices();
      }

      const result = await response.json();
      return result.voices || this.getMockVoices();
    } catch (error) {
      return this.getMockVoices();
    }
  }

  private getMockVoices(): CoquiVoice[] {
    return [
      { id: 'jenny', name: 'Jenny', language: 'en', gender: 'female' },
      { id: 'ryan', name: 'Ryan', language: 'en', gender: 'male' },
      { id: 'aria', name: 'Aria', language: 'en', gender: 'female' },
      { id: 'guy', name: 'Guy', language: 'en', gender: 'male' },
      { id: 'marie', name: 'Marie', language: 'fr', gender: 'female' },
      { id: 'pierre', name: 'Pierre', language: 'fr', gender: 'male' }
    ];
  }

  /**
   * Clone a voice from audio sample
   */
  async cloneVoice(
    audioSample: Buffer,
    voiceName: string
  ): Promise<{ voiceId: string; message: string }> {
    const formData = new FormData();
    formData.append('audio', new Blob([new Uint8Array(audioSample)]), 'sample.wav');
    formData.append('name', voiceName);

    const response = await fetch(`${this.baseUrl}/api/voices/clone`, {
      method: 'POST',
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Voice cloning failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      voiceId: result.voice_id || `cloned_${voiceName}_${Date.now()}`,
      message: result.message || 'Voice cloned successfully'
    };
  }

  /**
   * Health check for Coqui TTS service
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

  /**
   * Stream TTS synthesis for long texts
   */
  async *streamSynthesize(
    text: string,
    options: CoquiSynthesisOptions = {}
  ): AsyncGenerator<Buffer, void, unknown> {
    // Split text into sentences for streaming
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      const result = await this.synthesize(sentence.trim(), options);
      yield result.audio;
    }
  }
}

// Factory function for creating Coqui adapter
export function createCoquiAdapter(baseUrl?: string, apiKey?: string): CoquiAdapter {
  return new CoquiAdapter(baseUrl, apiKey);
}
