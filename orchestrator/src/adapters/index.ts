/**
 * Adapter module exports
 * Provides unified access to all adapter implementations
 */

export { WhisperAdapter, createWhisperAdapter } from './whisper';
export type { WhisperTranscription, WhisperOptions } from './whisper';

export { CoquiAdapter, createCoquiAdapter } from './coqui';
export type { 
  CoquiVoice, 
  CoquiSynthesisOptions, 
  CoquiSynthesisResult 
} from './coqui';

export { StorageAdapter, createStorageAdapter } from './storage';
export type { 
  StorageFile, 
  StorageUploadOptions, 
  StorageListOptions 
} from './storage';
