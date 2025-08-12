#!/usr/bin/env node
// Service de heartbeat périodique Redis Streams
// Conforme aux spécifications ONBOARDING_AI.md
// Envoie des heartbeats toutes les 30 secondes sur agents:global et agents:pair:team03

const { createClient } = require('redis');
const { randomUUID } = require('crypto');

class HeartbeatService {
  constructor() {
    this.client = null;
    this.interval = null;
    this.running = false;
  }

  async start() {
    if (this.running) return;
    
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.client = createClient({ url: redisUrl });
    
    this.client.on('error', (err) => {
      console.error('[HEARTBEAT] Redis error:', err.message);
    });

    this.client.on('connect', () => {
      console.log('[HEARTBEAT] Connected to Redis');
    });

    this.client.on('ready', () => {
      console.log('[HEARTBEAT] Redis ready');
    });

    try {
      await this.client.connect();
      this.running = true;
      
      // Premier heartbeat immédiat
      await this.sendHeartbeat('AGENT_ONLINE');
      
      // Heartbeats périodiques selon spec: 600s ± 30s (jitter pour éviter pics synchrones)
      const baseInterval = 600000; // 600 seconds = 10 minutes
      const jitter = 30000;        // ± 30 seconds
      
      const scheduleNextHeartbeat = () => {
        const interval = baseInterval + (Math.random() * 2 - 1) * jitter;
        setTimeout(async () => {
          try {
            await this.sendHeartbeat('ORCHESTRATOR_ALIVE');
            scheduleNextHeartbeat(); // Programme le suivant
          } catch (error) {
            console.error('[HEARTBEAT] Failed to send periodic heartbeat:', error.message);
            scheduleNextHeartbeat(); // Reprogram même en cas d'erreur
          }
        }, interval);
      };

      scheduleNextHeartbeat();
      console.log('[HEARTBEAT] Service started - heartbeats every 600s ± 30s (spec compliant)');
      
    } catch (error) {
      console.error('[HEARTBEAT] Failed to start service:', error.message);
      throw error;
    }
  }

  async sendHeartbeat(type = 'PERIODIC') {
    if (!this.client || !this.running) return;

    const now = new Date().toISOString();
    const correlation = randomUUID();
    
    // Canaux selon spécification onboarding et CLAIMS_AUDITS_REDIS_POLICY.md
    const streams = [
      'agents:global',
      'agents:pair:team03',
      'agents:orchestrator'  // Canal spécifique orchestrator
    ];

    const baseFields = [
      'from_agent', 'orchestrator',
      'team', 'orange', 
      'role', 'impl',
      'to', 'coordination',  // Selon spec INTER_AGENT_COMMUNICATION
      'topic', 'HEARTBEAT',
      'event', type,
      'status', 'ONLINE',
      'severity', 'INFO',
      'timestamp', now,
      'correlation_id', correlation,
      'pair_id', 'team03',   // Obligatoire selon spec
      'task_id', 'heartbeat-service',
      'tm_ids', JSON.stringify(['heartbeat']),
      'details', `Heartbeat from orchestrator - ${type.toLowerCase()} - spec compliant`
    ];

    const promises = streams.map(async (stream) => {
      try {
        const id = await this.client.sendCommand(['XADD', stream, '*', ...baseFields]);
        console.log(`[HEARTBEAT] Sent to ${stream}: ${id} (${type})`);
        return { stream, id, success: true };
      } catch (error) {
        console.error(`[HEARTBEAT] Failed to send to ${stream}:`, error.message);
        return { stream, error: error.message, success: false };
      }
    });

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    console.log(`[HEARTBEAT] ${type}: ${successful}/${streams.length} streams updated`);
    
    return results;
  }

  async stop() {
    if (!this.running) return;
    
    this.running = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    try {
      // Heartbeat final
      await this.sendHeartbeat('SHUTDOWN');
      await this.client?.quit();
      console.log('[HEARTBEAT] Service stopped');
    } catch (error) {
      console.error('[HEARTBEAT] Error during shutdown:', error.message);
    }
  }

  async sendStatusUpdate(event, status, taskId, details) {
    if (!this.client || !this.running) return;

    const now = new Date().toISOString();
    const correlation = randomUUID();
    
    const streams = ['agents:global', 'agents:orchestrator'];
    
    const fields = [
      'from_agent', 'orchestrator',
      'team', 'orange',
      'role', 'impl', 
      'topic', 'STATUS_UPDATE',
      'event', event,
      'status', status,
      'severity', status === 'FAILED' ? 'CRITICAL' : 'INFO',
      'timestamp', now,
      'correlation_id', correlation,
      'task_id', String(taskId),
      'tm_ids', JSON.stringify([taskId]),
      'details', String(details)
    ];

    for (const stream of streams) {
      try {
        const id = await this.client.sendCommand(['XADD', stream, '*', ...fields]);
        console.log(`[STATUS] Sent to ${stream}: ${id} (${event}/${status})`);
      } catch (error) {
        console.error(`[STATUS] Failed to send to ${stream}:`, error.message);
      }
    }
  }
}

// Exportation pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeartbeatService;
}

// Exécution directe si lancé comme script
if (require.main === module) {
  const service = new HeartbeatService();
  
  // Gestion des signaux pour arrêt propre
  process.on('SIGINT', async () => {
    console.log('\n[HEARTBEAT] Received SIGINT, shutting down gracefully...');
    await service.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n[HEARTBEAT] Received SIGTERM, shutting down gracefully...');
    await service.stop();
    process.exit(0);
  });

  // Démarrage du service
  service.start().catch((error) => {
    console.error('[HEARTBEAT] Failed to start service:', error);
    process.exit(1);
  });
}
