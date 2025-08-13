
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProcessDocumentResponseSchema } from '@/types/schemas';

export const useDocumentProcessing = () => {
  const { toast } = useToast();

  const processDocument = useMutation({
    mutationFn: async ({
      sourceId,
      filePath,
      sourceType
    }: {
      sourceId: string;
      filePath: string;
      sourceType: string;
    }) => {
      console.log('Initiating document processing for:', { sourceId, filePath, sourceType });

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          sourceId,
          filePath,
          sourceType
        }
      });

      if (error) {
        console.error('Document processing error:', error);
        throw error;
      }
      const parsed = ProcessDocumentResponseSchema.safeParse(data);
      if (!parsed.success) {
        console.error('Process-document response schema mismatch', parsed.error);
        if (import.meta.env.DEV) {
          throw new Error('Process-document response schema mismatch');
        }
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Document processing initiated successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to initiate document processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start document processing. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    processDocumentAsync: processDocument.mutateAsync,
    processDocument: processDocument.mutate,
    isProcessing: processDocument.isPending,
  };
};
