import { Env } from '../env.js';

export function createPdf(_env: Env) {
  return {
    async extractText(_url: string): Promise<string> {
      // MOV: extraction PDF réelle sera intégrée au lot 16 ; pour MOV on ne traite que le texte direct
      return '';
    }
  };
}

export type PdfClient = ReturnType<typeof createPdf>;
