import { z } from 'zod';

export const ChatResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    output: z.array(
      z.object({
        text: z.string(),
        citations: z
          .array(
            z.object({
              chunk_index: z.number(),
              chunk_source_id: z.string(),
              chunk_lines_from: z.number(),
              chunk_lines_to: z.number(),
            }),
          )
          .optional(),
      }),
    ),
  }),
});

export const ProcessDocumentResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  result: z.any().optional(),
  error: z.any().optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type ProcessDocumentResponse = z.infer<typeof ProcessDocumentResponseSchema>;
