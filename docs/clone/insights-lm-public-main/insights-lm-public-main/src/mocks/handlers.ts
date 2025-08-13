import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase REST for minimal UI rendering
  http.get('*/rest/v1/notebooks', async ({ request }) => {
    const url = new URL(request.url);
    const idFilter = url.searchParams.get('id');
    const userIdFilter = url.searchParams.get('user_id');
    const sampleUser = '00000000-0000-0000-0000-0000000000aa';
    const sampleId = '00000000-0000-0000-0000-000000000010';
    const rows = [
      {
        id: sampleId,
        user_id: sampleUser,
        title: 'Sample Notebook',
        description: 'Demo description',
        generation_status: 'completed',
        audio_overview_url: 'http://127.0.0.1:54321/storage/v1/object/public/audio/mock.mp3',
        audio_url_expires_at: new Date(Date.now() + 3600_000).toISOString(),
        example_questions: ['Summarize the document', 'List key insights'],
        updated_at: new Date().toISOString(),
      },
    ];
    const filtered = rows.filter(r =>
      (!idFilter || idFilter.includes(r.id)) && (!userIdFilter || userIdFilter.includes(r.user_id))
    );
    return HttpResponse.json(filtered);
  }),
  http.get('*/rest/v1/sources', async ({ request }) => {
    const url = new URL(request.url);
    const notebookIdEq = url.searchParams.get('notebook_id');
    const sampleId = '00000000-0000-0000-0000-000000000010';
    const rows = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        notebook_id: sampleId,
        title: 'Mock Source',
        type: 'pdf',
        processing_status: 'completed',
        created_at: new Date().toISOString(),
      },
    ];
    const filtered = rows.filter(r => !notebookIdEq || notebookIdEq.includes(r.notebook_id));
    return HttpResponse.json(filtered);
  }),
  http.get('*/rest/v1/n8n_chat_histories', async () => {
    // start with empty history; UI will still show Chat with example questions
    return HttpResponse.json([]);
  }),

  // Mock Supabase Edge Function: send-chat-message
  http.post('*/functions/v1/send-chat-message', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: { output: [{ text: `Echo: ${body?.message}` }] } });
  }),

  // Mock Supabase Edge Function: process-document
  http.post('*/functions/v1/process-document', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, message: 'Document processing initiated (mock)', result: { source_id: body?.sourceId } });
  }),

  // Mock Supabase Edge Function: generate-notebook-content
  http.post('*/functions/v1/generate-notebook-content', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: { notebookId: body?.notebookId, title: 'Generated Title' } });
  }),

  // Mock Supabase Edge Function: generate-audio-overview
  http.post('*/functions/v1/generate-audio-overview', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: { notebookId: body?.notebookId } });
  }),

  // Mock Supabase Edge Function: refresh-audio-url
  http.post('*/functions/v1/refresh-audio-url', async ({ request }) => {
    return HttpResponse.json({ success: true, data: { audio_overview_url: 'http://127.0.0.1:54321/storage/v1/object/public/audio/mock.mp3' } });
  }),

  // Mock Supabase Edge Function: process-additional-sources
  http.post('*/functions/v1/process-additional-sources', async ({ request }) => {
    const body = await request.json();
    if (body?.type === 'copied-text') {
      return HttpResponse.json({ success: true, message: 'Copied text accepted', result: { sourceIds: body?.sourceIds } });
    }
    if (body?.type === 'multiple-websites') {
      return HttpResponse.json({ success: true, message: 'Websites accepted', result: { count: (body?.urls || []).length } });
    }
    return HttpResponse.json({ success: true });
  }),
];
