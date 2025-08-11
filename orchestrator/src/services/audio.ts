import { Env } from '../env.js';

export function createAudio(_env: Env) {
  return {
    async synthesize(_text: string): Promise<Uint8Array> {
      // Simule une sortie audio binaire
      return new Uint8Array([1, 2, 3, 4]);
    }
  };
}

export type AudioService = ReturnType<typeof createAudio>;
