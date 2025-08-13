import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { loadEnv, Env } from './env.js';
import { createDb } from './services/db.js';
import { createOllama } from './services/ollama.js';
import { createSupabase } from './services/supabase.js';
import { createJobs } from './services/jobs.js';
import { createDocumentProcessor } from './services/document.js';
import { createAudio } from './services/audio.js';
import { createStorage } from './services/storage.js';
import { createIdempotencyStore } from './services/idempotency.js';
import { createWhisper } from './services/whisper.js';
import { createPdf } from './services/pdf.js';
import { request as undiciRequest } from 'undici';
import { createComms } from './services/comms/index.js';

export type AppDeps = {
  env: Env;
  db: ReturnType<typeof createDb>;
  ollama: ReturnType<typeof createOllama>;
  supabase: ReturnType<typeof createSupabase>;
  jobs: ReturnType<typeof createJobs>;
  docProc: ReturnType<typeof createDocumentProcessor>;
  whisper: ReturnType<typeof createWhisper>;
};

export function buildApp(deps?: Partial<AppDeps>): FastifyInstance {
  const env = deps?.env ?? loadEnv();
  const app = Fastify({ logger: true });

  const db = deps?.db ?? createDb(env);
  const ollama = deps?.ollama ?? createOllama(env);
  const supabase = (deps as any)?.supabase ?? createSupabase(env);
  const jobs = (deps as any)?.jobs ?? createJobs();
  const pdf = (deps as any)?.pdf ?? createPdf(env);
  const docProc = (deps as any)?.docProc ?? createDocumentProcessor(env, { ollama, db, pdf });
  const audio = (deps as any)?.audio ?? createAudio(env);
  const storage = (deps as any)?.storage ?? createStorage(env);
  const whisper = (deps as any)?.whisper ?? createWhisper(env);
  const idem = createIdempotencyStore(Number((env as any).IDEMPOTENCY_TTL_MS) || undefined);
  const comms = createComms(env);
  let gpuProbeCache: { ts: number; ok: boolean } = { ts: 0, ok: false };
  let heartbeatService: any = null;

  // Service de heartbeat périodique selon spécifications ONBOARDING_AI.md
  if (comms && env.REDIS_URL) {
    const HeartbeatService = require('../scripts/heartbeat-service.cjs');
    heartbeatService = new HeartbeatService();
    // Démarrage asynchrone pour ne pas bloquer le démarrage de l'app
    heartbeatService.start().catch((error: any) => {
      app.log.warn({ error: error.message }, 'Failed to start heartbeat service');
    });
  }

  // Hook AGENT_ONLINE au boot Fastify (correction auditeur équipe 2)
  app.ready(async () => {
    if (comms) {
      try {
        const { randomUUID } = await import('crypto');
        await comms.publishHeartbeat({
          from_agent: 'orchestrator',
          team: 'orange',
          role: 'impl',
          tm_ids: ['orchestrator-boot'],
          task_id: 'orchestrator-startup',
          event: 'AGENT_ONLINE',
          status: 'ONLINE',
          severity: 'INFO' as const,
          timestamp: new Date().toISOString(),
          correlation_id: randomUUID(),
          details: 'Orchestrator Fastify application started'
        });
        app.log.info('AGENT_ONLINE heartbeat sent on app ready');
      } catch (error: any) {
        app.log.warn({ error: error.message }, 'Failed to send AGENT_ONLINE heartbeat');
      }
    }

    // Job périodique pour ORCHESTRATOR_ALIVE si REDIS_URL présent (correction auditeur équipe 2)
    if (comms && env.REDIS_URL) {
      const sendAliveHeartbeat = async () => {
        try {
          const { randomUUID } = await import('crypto');
          await comms.publishHeartbeat({
            from_agent: 'orchestrator',
            team: 'orange',
            role: 'impl',
            tm_ids: ['orchestrator-alive'],
            task_id: 'orchestrator-maintenance',
            event: 'ORCHESTRATOR_ALIVE',
            status: 'ONLINE',
            severity: 'INFO' as const,
            timestamp: new Date().toISOString(),
            correlation_id: randomUUID(),
            details: 'Orchestrator periodic alive heartbeat'
          });
          app.log.debug('ORCHESTRATOR_ALIVE periodic heartbeat sent');
        } catch (error: any) {
          app.log.warn({ error: error.message }, 'Failed to send ORCHESTRATOR_ALIVE heartbeat');
        }
      };

      // Premier alive après 30s, puis tous les 600s ± 30s
      setTimeout(() => {
        sendAliveHeartbeat();
        
        const scheduleNext = () => {
          const baseInterval = 600000; // 10 minutes
          const jitter = 30000;        // ± 30s
          const interval = baseInterval + (Math.random() * 2 - 1) * jitter;
          
          setTimeout(() => {
            sendAliveHeartbeat().finally(scheduleNext);
          }, interval);
        };
        
        scheduleNext();
        app.log.info('ORCHESTRATOR_ALIVE periodic job started (600s ± 30s)');
      }, 30000);
    }
  });

  async function ensureGpuAvailable(): Promise<boolean> {
    if (env.GPU_ONLY !== '1' || !env.OLLAMA_EMBED_MODEL) return true;
    const now = Date.now();
    if (now - gpuProbeCache.ts < 15000) return gpuProbeCache.ok;
    try {
      const ok = await ollama.checkGpu(env.OLLAMA_EMBED_MODEL);
      gpuProbeCache = { ts: now, ok };
      return ok;
    } catch {
      gpuProbeCache = { ts: now, ok: false };
      return false;
    }
  }

  app.decorate('env', env);
  app.decorate('db', db);
  app.decorate('ollama', ollama);
  app.decorate('supabase', supabase);
  app.decorate('jobs', jobs);
  app.decorate('docProc', docProc);
  app.decorate('audio', audio);
  app.decorate('storage', storage);
  app.decorate('whisper', whisper);

  app.register(fp(async (instance: FastifyInstance) => {
    function redactHeaders(h?: Record<string, any>) {
      if (!h) return {} as Record<string, any>;
      const r: Record<string, any> = { ...h };
      if ('authorization' in r) r['authorization'] = '[REDACTED]';
      if ('Authorization' in r) r['Authorization'] = '[REDACTED]';
      return r;
    }
    instance.addHook('preValidation', async (req: FastifyRequest, reply: FastifyReply) => {
      const url = (req as any).routeOptions?.url as string | undefined;
      if (!url || !url.startsWith('/webhook')) return;
      const header = req.headers['authorization'];
      if (!header || header !== env.NOTEBOOK_GENERATION_AUTH) {
        return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Invalid Authorization', correlation_id: req.id });
      }
    });
    instance.addHook('onResponse', async (req, reply) => {
      const pct = Number((env as any).LOG_SAMPLE_PCT ?? 100);
      const samplePct = Number.isFinite(pct) ? Math.min(Math.max(pct, 0), 100) : 100;
      const alwaysLog = (reply as any)?.statusCode >= 400;
      const shouldLog = alwaysLog || (Math.random() * 100 < samplePct);
      if (!shouldLog) return;
      instance.log.info({ correlation_id: (req as any).id, route: (req as any).routerPath ?? (req as any).url, method: (req as any).method, headers: redactHeaders((req as any).headers) }, 'request complete');
    });
  }));

  app.addHook('onRequest', async (req) => {
    (req as any).correlationId = (req as any).id;
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/ready', async (req: FastifyRequest, reply: FastifyReply) => {
    const details: Record<string, unknown> = {};
    let ok = true;

    try { await db.ping(); details.db = 'ok'; } catch (e) { details.db = { error: String(e) }; ok = false; }

    try {
      const tags = await ollama.listModels(); details.ollama = 'ok';
      const need = [env.OLLAMA_EMBED_MODEL, env.OLLAMA_LLM_MODEL].filter(Boolean) as string[];
      const names = (tags as any).models?.map((m: any) => m.name) ?? [];
      const missing = need.filter((m) => !names.includes(m)); details.models = missing.length ? { missing } : 'ok';
      if (missing.length) ok = false;
      if (env.GPU_ONLY === '1' && env.OLLAMA_EMBED_MODEL) {
        try { const gpuOk = await ollama.checkGpu(env.OLLAMA_EMBED_MODEL); details.gpu = gpuOk ? 'ok' : { error: 'embedding probe failed or timed out' }; if (!gpuOk) ok = false; }
        catch (e) { details.gpu = { error: String(e) }; ok = false; }
      }
    } catch (e) { details.ollama = { error: String(e) }; ok = false; }

    if (env.WHISPER_ASR_URL) {
      try { await whisper.transcribe('http://localhost:0/health.wav'); details.whisper = 'ok'; }
      catch (e) { details.whisper = { error: String(e) }; ok = false; }
    }

    if (env.COQUI_TTS_URL) {
      try { await audio.synthesize('[healthcheck]'); details.coqui = 'ok'; }
      catch (e) { details.coqui = { error: String(e) }; ok = false; }
    }

    if (!ok) return reply.code(503).send({ code: 'NOT_READY', message: 'Dependencies not ready', details, correlation_id: req.id });
    return { ready: true, details };
  });

  app.setErrorHandler((err, req, reply) => {
    const status = (err as any)?.statusCode ?? 500;
    const code = status === 401 ? 'UNAUTHORIZED' : status === 422 ? 'UNPROCESSABLE_ENTITY' : status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR';
    const message = (err as any)?.message ?? 'Internal Server Error';
    reply.code(status).send({ code, message, details: undefined, correlation_id: req.id });
  });

  function requireFields(body: any, fields: string[]) { for (const f of fields) { if (!body[f]) throw Object.assign(new Error(`Missing ${f}`), { statusCode: 422 }); } }

  app.addHook('onSend', async (req, reply, payload) => { reply.header('x-correlation-id', (req as any).id); return payload; });

  app.post('/webhook/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!(await ensureGpuAvailable())) {
      return reply.code(503).send({ code: 'GPU_REQUIRED', message: 'GPU enforcement active; device not available', correlation_id: (req as any).id });
    }
    const body: any = (req as any).body ?? {};
    let messages: Array<{ role: string; content: string }> = [];
    let notebookId: string | undefined;
    if (typeof body.session_id === 'string' && typeof body.message === 'string' && body.message.length) { messages = [{ role: 'user', content: body.message }]; notebookId = body.session_id; }
    else { messages = Array.isArray(body.messages) ? body.messages : [{ role: 'user', content: body.message }].filter(Boolean); notebookId = body.notebookId ?? body.session_id; }
    if (env.OLLAMA_LLM_MODEL && messages.length) {
      const t0 = Date.now();
      app.log.info({ correlation_id: (req as any).id, event_code: 'RAG_START', route: '/webhook/chat' }, 'RAG start');
      let citations: any[] = [];
      let tMatchStart: number | null = null;
      let tMatchEnd: number | null = null;
      try {
        const query = messages[messages.length - 1]?.content as string | undefined;
        if (query) {
          tMatchStart = Date.now();
          citations = (await supabase.matchDocuments(query, notebookId)).slice(0, 5);
          tMatchEnd = Date.now();
        }
      } catch {}
      const tGen0 = Date.now();
      const chatRes = await ollama.chat(env.OLLAMA_LLM_MODEL, messages); const text = chatRes?.message?.content ?? '';
      const tGen1 = Date.now();
      try { const lastUser = messages[messages.length - 1]; if (lastUser?.role && lastUser?.content) await db.insertMessage(notebookId ?? null, lastUser.role, lastUser.content); if (text) await db.insertMessage(notebookId ?? null, 'assistant', text); } catch {}
      const t1 = Date.now();
      const rag_total_ms = t1 - t0;
      const match_ms = tMatchStart && tMatchEnd ? (tMatchEnd - tMatchStart) : null;
      app.log.info({ correlation_id: (req as any).id, event_code: 'RAG_COMPLETE', route: '/webhook/chat', rag_duration_ms: rag_total_ms, match_documents_ms: match_ms, llm_generate_ms: tGen1 - tGen0 }, 'RAG complete');
      return reply.code(200).send({ success: true, data: { output: [{ text, citations }] } });
    }
    return reply.code(200).send({ success: true, data: { output: [] } });
  });

  app.post('/webhook/process-document', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!(await ensureGpuAvailable())) {
      return reply.code(503).send({ code: 'GPU_REQUIRED', message: 'GPU enforcement active; device not available', correlation_id: (req as any).id });
    }
    const b: any = (req as any).body ?? {};
    const body = { ...b, source_id: b.source_id ?? b.sourceId, file_url: b.file_url ?? b.fileUrl, file_path: b.file_path ?? b.filePath, source_type: b.source_type ?? b.sourceType, callback_url: b.callback_url ?? b.callbackUrl, notebook_id: b.notebook_id ?? b.notebookId, path: b.path };

    const legacy = typeof b.path === 'string' || typeof b.text === 'string';
    const openApiSignal = ['file_url','file_path','source_type','callback_url','source_id','notebook_id'].some((k) => typeof b[k] !== 'undefined');
    if (!legacy && openApiSignal) {
      requireFields(body, ['source_id','file_url','file_path','source_type','callback_url']);
    }

    const idemKey = (req.headers['idempotency-key'] as string|undefined)?.trim();
    if (idemKey) { const cached = idem.get(idemKey); if (cached) return reply.code(cached.statusCode).send(cached.body); idem.begin(idemKey); }

    // heartbeat START
    if (comms) {
      await comms.publishHeartbeat({
        from_agent: 'orchestrator',
        team: 'orange',
        role: 'impl',
        tm_ids: ['process-document'],
        task_id: String(body.source_id ?? ''),
        event: 'PROCESS_DOCUMENT',
        status: 'START',
        severity: 'INFO',
        timestamp: new Date().toISOString(),
        correlation_id: (req as any).id,
        details: 'Process document started'
      }).catch(() => {});
    }

    await app.docProc.processDocument({ notebookId: body.notebook_id, sourceId: body.source_id, text: body.text, sourceType: body.source_type, fileUrl: body.file_url, correlationId: (req as any).correlationId });

    app.jobs.add('process-document', async () => {
      try {
        await app.docProc.processDocument({ notebookId: body.notebook_id, sourceId: body.source_id, text: body.text, sourceType: body.source_type, fileUrl: body.file_url, correlationId: (req as any).correlationId });
        if (body.callback_url) {
          try {
            await undiciRequest(body.callback_url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-correlation-id': (req as any).id }, headersTimeout: 2000, bodyTimeout: 2000, body: JSON.stringify({ source_id: body.source_id, status: 'completed' }) });
            app.log.info({ correlation_id: (req as any).id, event_code: 'CALLBACK_SENT', route: '/webhook/process-document', callback_host: (() => { try { return new URL(String(body.callback_url)).host; } catch { return undefined; } })() }, 'Callback sent');
          } catch {}
        }
        // heartbeat DONE
        if (comms) {
          await comms.publishHeartbeat({
            from_agent: 'orchestrator',
            team: 'orange',
            role: 'impl',
            tm_ids: ['process-document'],
            task_id: String(body.source_id ?? ''),
            event: 'PROCESS_DOCUMENT',
            status: 'DONE',
            severity: 'INFO',
            timestamp: new Date().toISOString(),
            correlation_id: (req as any).id,
            details: 'Process document completed'
          }).catch(() => {});
        }
      }
      catch (e) {
        try { if ((app.db as any).updateSourceStatus && body.source_id) await (app.db as any).updateSourceStatus(body.source_id, 'failed'); } catch {}
        if (body.callback_url) { try { await undiciRequest(body.callback_url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-correlation-id': (req as any).id }, headersTimeout: 2000, bodyTimeout: 2000, body: JSON.stringify({ source_id: body.source_id, status: 'failed' }) }); app.log.info({ correlation_id: (req as any).id, event_code: 'CALLBACK_SENT', route: '/webhook/process-document', callback_host: (() => { try { return new URL(String(body.callback_url)).host; } catch { return undefined; } })() }, 'Callback sent'); } catch {} }
        // blocker CRITICAL
        if (comms) {
          await comms.publishBlocker({
            from_agent: 'orchestrator',
            team: 'orange',
            role: 'impl',
            tm_ids: ['process-document'],
            task_id: String(body.source_id ?? ''),
            event: 'PROCESS_DOCUMENT',
            status: 'FAILED',
            severity: 'CRITICAL',
            timestamp: new Date().toISOString(),
            correlation_id: (req as any).id,
            details: 'Process document failed'
          }).catch(() => {});
        }
      }
    }, {});

    const response = { success: true, message: 'Document processing initiated' };
    if (idemKey) idem.complete(idemKey, { statusCode: 202, body: response });
    return reply.code(202).send(response);
  });

  app.post('/webhook/process-additional-sources', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!(await ensureGpuAvailable())) {
      return reply.code(503).send({ code: 'GPU_REQUIRED', message: 'GPU enforcement active; device not available', correlation_id: (req as any).id });
    }
    const b: any = (req as any).body ?? {};
    const body = { ...b, sourceId: b.sourceId ?? (Array.isArray(b.sourceIds)? b.sourceIds[0]: undefined) };

    const idemKey = (req.headers['idempotency-key'] as string|undefined)?.trim();
    if (idemKey) { const cached = idem.get(idemKey); if (cached) return reply.code(cached.statusCode).send(cached.body); idem.begin(idemKey); }

    if (body.type === 'copied-text') {
      try {
        // heartbeat START
        if (comms) {
          await comms.publishHeartbeat({
            from_agent: 'orchestrator', team: 'orange', role: 'impl', tm_ids: ['process-additional-sources'], task_id: String(body.sourceId ?? ''), event: 'PROCESS_ADDITIONAL_SOURCES', status: 'START', severity: 'INFO', timestamp: new Date().toISOString(), correlation_id: (req as any).id, details: 'copied-text start'
          }).catch(() => {});
        }
        requireFields(body, ['notebookId','content','sourceId']);
        try { await (app as any).storage.uploadText(String(body.content ?? ''), `sources/${body.notebookId}/${body.sourceId}.txt`); } catch {}
        await app.docProc.processDocument({ notebookId: body.notebookId, sourceId: body.sourceId, text: body.content, sourceType: 'txt', correlationId: (req as any).correlationId });
        const res = { success: true, message: 'copied-text data sent to webhook successfully', webhookResponse: 'OK' };
        if (idemKey) idem.complete(idemKey, { statusCode: 200, body: res });
        // heartbeat DONE
        if (comms) {
          await comms.publishHeartbeat({
            from_agent: 'orchestrator', team: 'orange', role: 'impl', tm_ids: ['process-additional-sources'], task_id: String(body.sourceId ?? ''), event: 'PROCESS_ADDITIONAL_SOURCES', status: 'DONE', severity: 'INFO', timestamp: new Date().toISOString(), correlation_id: (req as any).id, details: 'copied-text done'
          }).catch(() => {});
        }
        return reply.code(200).send(res);
      } catch (e) {
        const res = { code: 'UNPROCESSABLE_ENTITY', message: 'Invalid copied-text payload' };
        if (idemKey) idem.complete(idemKey, { statusCode: 422, body: res });
        // blocker
        if (comms) {
          await comms.publishBlocker({
            from_agent: 'orchestrator', team: 'orange', role: 'impl', tm_ids: ['process-additional-sources'], task_id: String(body.sourceId ?? ''), event: 'PROCESS_ADDITIONAL_SOURCES', status: 'FAILED', severity: 'CRITICAL', timestamp: new Date().toISOString(), correlation_id: (req as any).id, details: 'copied-text failed'
          }).catch(() => {});
        }
        return reply.code(422).send(res);
      }
    }
    if (body.type === 'multiple-websites') {
      try {
        // heartbeat START
        if (comms) {
          await comms.publishHeartbeat({
            from_agent: 'orchestrator', team: 'orange', role: 'impl', tm_ids: ['process-additional-sources'], task_id: String(body.sourceId ?? ''), event: 'PROCESS_ADDITIONAL_SOURCES', status: 'START', severity: 'INFO', timestamp: new Date().toISOString(), correlation_id: (req as any).id, details: 'multiple-websites start'
          }).catch(() => {});
        }
        requireFields(body, ['notebookId','urls']);
        const urls: string[] = body.urls ?? [];
        const sourceIds: string[] = b.sourceIds ?? [];
        for (let i = 0; i < urls.length; i++) {
          const sid = sourceIds[i] ?? sourceIds[0];
          let websiteText = '';
          try { websiteText = await (app as any).storage.fetchText(urls[i]); } catch {}
          try { await (app as any).storage.uploadText(String(websiteText ?? ''), `sources/${body.notebookId}/${sid}.txt`); } catch {}
          await app.docProc.processDocument({ notebookId: body.notebookId, sourceId: sid, sourceType: 'txt', text: websiteText || undefined, fileUrl: websiteText ? undefined : urls[i], correlationId: (req as any).correlationId });
        }
        const res = { success: true, message: 'multiple-websites data sent to webhook successfully', webhookResponse: 'OK' };
        if (idemKey) idem.complete(idemKey, { statusCode: 200, body: res });
        // heartbeat DONE
        if (comms) {
          await comms.publishHeartbeat({
            from_agent: 'orchestrator', team: 'orange', role: 'impl', tm_ids: ['process-additional-sources'], task_id: String(body.sourceId ?? ''), event: 'PROCESS_ADDITIONAL_SOURCES', status: 'DONE', severity: 'INFO', timestamp: new Date().toISOString(), correlation_id: (req as any).id, details: 'multiple-websites done'
          }).catch(() => {});
        }
        return reply.code(200).send(res);
      } catch (e) {
        const res = { code: 'UNPROCESSABLE_ENTITY', message: 'Invalid multiple-websites payload' };
        if (idemKey) idem.complete(idemKey, { statusCode: 422, body: res });
        // blocker
        if (comms) {
          await comms.publishBlocker({
            from_agent: 'orchestrator', team: 'orange', role: 'impl', tm_ids: ['process-additional-sources'], task_id: String(body.sourceId ?? ''), event: 'PROCESS_ADDITIONAL_SOURCES', status: 'FAILED', severity: 'CRITICAL', timestamp: new Date().toISOString(), correlation_id: (req as any).id, details: 'multiple-websites failed'
          }).catch(() => {});
        }
        return reply.code(422).send(res);
      }
    }

    const res = { success: true, message: 'Processed additional sources', webhookResponse: {} };
    if (idemKey) idem.complete(idemKey, { statusCode: 200, body: res });
    return reply.code(200).send(res);
  });

  app.post('/webhook/generate-notebook-content', async (req: FastifyRequest, reply: FastifyReply) => {
    const body: any = (req as any).body ?? {};
    const notebookId = body?.notebookId ?? body?.id ?? null;
    app.jobs.add('generate-notebook', async () => { try { if ((app.db as any).updateNotebookStatus) { await (app.db as any).updateNotebookStatus(notebookId, 'generating'); await (app.db as any).updateNotebookStatus(notebookId, 'ready'); } } catch {} }, {});
    return reply.code(202).send({ success: true, message: 'Notebook generation started in background' });
  });

  app.post('/webhook/generate-audio', async (req: FastifyRequest, reply: FastifyReply) => {
    const b: any = (req as any).body ?? {};
    const body = { ...b, notebook_id: b.notebook_id ?? b.notebookId };
    requireFields(body, ['notebook_id']);
    const notebookId: string | null = body?.notebook_id ?? null;
    const callbackUrl: string | null = body?.callback_url ?? null;

    const idemKey = (req.headers['idempotency-key'] as string|undefined)?.trim();
    if (idemKey) { const cached = idem.get(idemKey); if (cached) return reply.code(cached.statusCode).send(cached.body); idem.begin(idemKey); }

    try { if ((db as any).updateNotebookStatus && notebookId) await (db as any).updateNotebookStatus(notebookId, 'generating'); } catch {}

    const corr = (req as any).id;
    const route = '/webhook/generate-audio';

    // heartbeat START
    if (comms) {
      await comms.publishHeartbeat({
        from_agent: 'orchestrator',
        team: 'orange',
        role: 'impl',
        tm_ids: ['generate-audio'],
        task_id: String(notebookId ?? ''),
        event: 'TTS_JOB',
        status: 'START',
        severity: 'INFO',
        timestamp: new Date().toISOString(),
        correlation_id: corr,
        details: 'TTS job started'
      }).catch(() => {});
    }

    jobs.add('generate-audio', async () => {
      try {
        const t0 = Date.now();
        app.log.info({ correlation_id: corr, event_code: 'TTS_START', route }, 'TTS start');
        const bin = await (app as any).audio.synthesize('overview text');
        const t1 = Date.now();
        app.log.info({ correlation_id: corr, event_code: 'TTS_COMPLETE', route, tts_duration_ms: t1 - t0 }, 'TTS complete');

        const path = `audio/${notebookId ?? 'unknown'}.mp3`;
        const tUp0 = Date.now();
        app.log.info({ correlation_id: corr, event_code: 'UPLOAD_START', route, path }, 'Upload start');
        const audioUrl = await (app as any).storage.upload(bin, path);
        const tUp1 = Date.now();
        let host: string | undefined;
        try { host = new URL(String(audioUrl)).host; } catch {}
        app.log.info({ correlation_id: corr, event_code: 'UPLOAD_COMPLETE', route, upload_duration_ms: tUp1 - tUp0, audio_url_host: host }, 'Upload complete');

        if ((db as any).setNotebookAudio && notebookId) await (db as any).setNotebookAudio(notebookId, audioUrl);
        if ((db as any).updateNotebookStatus && notebookId) await (db as any).updateNotebookStatus(notebookId, 'completed');

        if (callbackUrl) {
          for (let i = 0; i < 2; i++) {
            try {
              await undiciRequest(callbackUrl, { method: 'POST', headers: { 'content-type': 'application/json', 'x-correlation-id': corr }, headersTimeout: 2000, bodyTimeout: 2000, body: JSON.stringify({ notebook_id: notebookId, audio_url: audioUrl, status: 'success' }) });
              app.log.info({ correlation_id: corr, event_code: 'CALLBACK_SENT', route, callback_host: (() => { try { return new URL(String(callbackUrl)).host; } catch { return undefined; } })() }, 'Callback sent');
              break;
            } catch {}
          }
        }

        // heartbeat DONE
        if (comms) {
          await comms.publishHeartbeat({
            from_agent: 'orchestrator',
            team: 'orange',
            role: 'impl',
            tm_ids: ['generate-audio'],
            task_id: String(notebookId ?? ''),
            event: 'TTS_JOB',
            status: 'DONE',
            severity: 'INFO',
            timestamp: new Date().toISOString(),
            correlation_id: corr,
            details: 'TTS job completed'
          }).catch(() => {});
        }
      } catch (e) {
        try { if ((db as any).updateNotebookStatus && notebookId) await (db as any).updateNotebookStatus(notebookId, 'failed'); } catch {}
        if (callbackUrl) { try { await undiciRequest(callbackUrl, { method: 'POST', headers: { 'content-type': 'application/json', 'x-correlation-id': corr }, headersTimeout: 2000, bodyTimeout: 2000, body: JSON.stringify({ notebook_id: notebookId, status: 'failed' }) }); app.log.info({ correlation_id: corr, event_code: 'CALLBACK_SENT', route, callback_host: (() => { try { return new URL(String(callbackUrl)).host; } catch { return undefined; } })() }, 'Callback sent'); } catch {} }
        // blocker CRITICAL
        if (comms) {
          await comms.publishBlocker({
            from_agent: 'orchestrator',
            team: 'orange',
            role: 'impl',
            tm_ids: ['generate-audio'],
            task_id: String(notebookId ?? ''),
            event: 'TTS_JOB',
            status: 'FAILED',
            severity: 'CRITICAL',
            timestamp: new Date().toISOString(),
            correlation_id: corr,
            details: 'TTS job failed'
          }).catch(() => {});
        }
      }
    }, {});

    const response = { success: true, message: 'Audio generation started' };
    if (idemKey) idem.complete(idemKey, { statusCode: 202, body: response });
    return reply.code(202).send(response);
  });

  // Hook de fermeture propre pour arrêter le service de heartbeat
  app.addHook('onClose', async () => {
    // Envoyer AGENT_OFFLINE avant fermeture (correction auditeur équipe 2)
    if (comms) {
      try {
        const { randomUUID } = await import('crypto');
        await comms.publishHeartbeat({
          from_agent: 'orchestrator',
          team: 'orange',
          role: 'impl',
          tm_ids: ['orchestrator-shutdown'],
          task_id: 'orchestrator-shutdown',
          event: 'AGENT_OFFLINE',
          status: 'OFFLINE',
          severity: 'INFO' as const,
          timestamp: new Date().toISOString(),
          correlation_id: randomUUID(),
          details: 'Orchestrator Fastify application shutting down'
        });
        app.log.info('AGENT_OFFLINE heartbeat sent before shutdown');
      } catch (error: any) {
        app.log.warn({ error: error.message }, 'Failed to send AGENT_OFFLINE heartbeat');
      }
    }
    
    if (heartbeatService) {
      try {
        await heartbeatService.stop();
        app.log.info('Heartbeat service stopped gracefully');
      } catch (error: any) {
        app.log.warn({ error: error.message }, 'Error stopping heartbeat service');
      }
    }
    if (comms) {
      try {
        await comms.close();
        app.log.info('Redis communications closed');
      } catch (error: any) {
        app.log.warn({ error: error.message }, 'Error closing Redis communications');
      }
    }
  });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    env: Env;
    db: ReturnType<typeof createDb>;
    ollama: ReturnType<typeof createOllama>;
    supabase: ReturnType<typeof createSupabase>;
    jobs: ReturnType<typeof createJobs>;
    docProc: ReturnType<typeof createDocumentProcessor>;
    audio: ReturnType<typeof createAudio>;
    storage: ReturnType<typeof createStorage>;
    whisper: ReturnType<typeof createWhisper>;
  }
}

export async function performBootChecks(app: FastifyInstance) {
  const { env, db, ollama, whisper, audio } = app;
  app.log.info('Performing boot checks...');

  try {
    await db.ping();
    app.log.info('DB connection: OK');
  } catch (e) {
    app.log.error({ err: e }, 'DB connection: FAILED');
    throw new Error('DB connection failed');
  }

  try {
    const tags = await ollama.listModels();
    app.log.info('Ollama connection: OK');
    const need = [env.OLLAMA_EMBED_MODEL, env.OLLAMA_LLM_MODEL].filter(Boolean) as string[];
    const names = (tags as any).models?.map((m: any) => m.name) ?? [];
    const missing = need.filter((m) => !names.includes(m));
    if (missing.length) {
      app.log.error({ missingModels: missing }, 'Ollama models: MISSING');
      throw new Error(`Missing Ollama models: ${missing.join(', ')}`);
    } else {
      app.log.info('Ollama models: OK');
    }
    if (env.GPU_ONLY === '1' && env.OLLAMA_EMBED_MODEL) {
      const gpuOk = await ollama.checkGpu(env.OLLAMA_EMBED_MODEL);
      if (!gpuOk) {
        app.log.error('GPU probe: FAILED');
        throw new Error('GPU probe failed');
      } else {
        app.log.info('GPU probe: OK');
      }
    }
  } catch (e) {
    app.log.error({ err: e }, 'Ollama connection: FAILED');
    throw new Error('Ollama connection failed');
  }

  if (env.WHISPER_ASR_URL) {
    try {
      await whisper.transcribe('http://localhost:0/health.wav');
      app.log.info('Whisper ASR connection: OK');
    } catch (e) {
      app.log.error({ err: e }, 'Whisper ASR connection: FAILED');
      throw new Error('Whisper ASR connection failed');
    }
  }

  if (env.COQUI_TTS_URL) {
    try {
      await audio.synthesize('[healthcheck]');
      app.log.info('Coqui TTS connection: OK');
    } catch (e) {
      app.log.error({ err: e }, 'Coqui TTS connection: FAILED');
      throw new Error('Coqui TTS connection failed');
    }
  }

  app.log.info('All boot checks passed.');
}
