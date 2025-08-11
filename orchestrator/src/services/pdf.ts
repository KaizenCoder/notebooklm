import { Env } from '../env.js';

export function createPdf(_env: Env) {
  return {
    async extractText(_url: string): Promise<string> {
      // Placeholder: extraction PDF réelle sera branchée (PyMuPDF/pdfminer via bridge)
      return 'PDF extracted text line 1\nline 2';
    }
  };
}

export type PdfClient = ReturnType<typeof createPdf>;
