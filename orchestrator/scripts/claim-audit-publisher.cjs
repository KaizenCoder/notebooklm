#!/usr/bin/env node
// Service de publication Redis pour Claims et Audits
// Conforme à CLAIMS_AUDITS_REDIS_POLICY.md

const { createClient } = require('redis');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

class ClaimAuditPublisher {
  constructor(redisUrl = null) {
    this.client = null;
    this.redisUrl = redisUrl || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  }

  async connect() {
    if (this.client) return;
    
    this.client = createClient({ url: this.redisUrl });
    this.client.on('error', (err) => {
      console.error('[PUBLISHER] Redis error:', err.message);
    });

    await this.client.connect();
    console.log('[PUBLISHER] Connected to Redis');
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      console.log('[PUBLISHER] Disconnected from Redis');
    }
  }

  /**
   * Publier un STATUS_UPDATE avant création/modification d'une claim
   * Conforme à CLAIMS_AUDITS_REDIS_POLICY.md
   */
  async publishClaimStatusUpdate(options = {}) {
    const {
      team = 'team03',
      fromAgent = 'impl_team03',
      toAgent = 'auditor_team03',
      event = 'CLAIM_PUBLISHED',
      status = 'INFO',
      taskId = '',
      links = [],
      details = '',
      correlationId = null
    } = options;

    await this.connect();

    const now = new Date().toISOString();
    const correlation = correlationId || randomUUID();
    
    const fields = [
      'from_agent', fromAgent,
      'team', team,
      'role', 'impl',
      'to', toAgent,
      'topic', 'STATUS_UPDATE',
      'event', event,
      'status', status,
      'timestamp', now,
      'correlation_id', correlation,
      'pair_id', team,
      'task_id', String(taskId),
      'tm_ids', JSON.stringify([taskId]),
      'links', JSON.stringify(links),
      'details', String(details)
    ];

    const streams = [`agents:pair:${team}`, 'agents:global'];
    const results = [];

    for (const stream of streams) {
      try {
        const id = await this.client.sendCommand(['XADD', stream, '*', ...fields]);
        console.log(`[CLAIM] STATUS_UPDATE sent to ${stream}: ${id}`);
        results.push({ stream, id, success: true });
      } catch (error) {
        console.error(`[CLAIM] Failed to send to ${stream}:`, error.message);
        results.push({ stream, error: error.message, success: false });
      }
    }

    return { correlation, results };
  }

  /**
   * Publier un AUDIT_REQUEST (impl → audit)
   */
  async publishAuditRequest(options = {}) {
    const {
      team = 'team03',
      fromAgent = 'impl_team03',
      toAgent = 'auditor_team03',
      event = 'READY_FOR_AUDIT',
      status = 'READY',
      taskId = '',
      links = [],
      details = '',
      correlationId = null
    } = options;

    await this.connect();

    const now = new Date().toISOString();
    const correlation = correlationId || randomUUID();
    
    const fields = [
      'from_agent', fromAgent,
      'team', team,
      'role', 'impl',
      'to', toAgent,
      'topic', 'AUDIT_REQUEST',
      'event', event,
      'status', status,
      'timestamp', now,
      'correlation_id', correlation,
      'pair_id', team,
      'task_id', String(taskId),
      'tm_ids', JSON.stringify([taskId]),
      'links', JSON.stringify(links),
      'details', String(details)
    ];

    const streams = [`agents:pair:${team}`];
    const results = [];

    for (const stream of streams) {
      try {
        const id = await this.client.sendCommand(['XADD', stream, '*', ...fields]);
        console.log(`[AUDIT] AUDIT_REQUEST sent to ${stream}: ${id}`);
        results.push({ stream, id, success: true });
      } catch (error) {
        console.error(`[AUDIT] Failed to send to ${stream}:`, error.message);
        results.push({ stream, error: error.message, success: false });
      }
    }

    return { correlation, results };
  }

  /**
   * Publier un AUDIT_VERDICT (audit → impl)
   */
  async publishAuditVerdict(options = {}) {
    const {
      team = 'team03',
      fromAgent = 'auditor_team03',
      toAgent = 'impl_team03',
      event = 'APPROVED', // ou 'REJECTED'
      status = 'OK',      // ou 'BLOCKED'
      taskId = '',
      links = [],
      details = '',
      correlationId = null
    } = options;

    await this.connect();

    const now = new Date().toISOString();
    const correlation = correlationId || randomUUID();
    
    const fields = [
      'from_agent', fromAgent,
      'team', team,
      'role', 'audit',
      'to', toAgent,
      'topic', 'AUDIT_VERDICT',
      'event', event,
      'status', status,
      'timestamp', now,
      'correlation_id', correlation,
      'pair_id', team,
      'task_id', String(taskId),
      'tm_ids', JSON.stringify([taskId]),
      'links', JSON.stringify(links),
      'details', String(details)
    ];

    const streams = [`agents:pair:${team}`, 'agents:global'];
    const results = [];

    for (const stream of streams) {
      try {
        const id = await this.client.sendCommand(['XADD', stream, '*', ...fields]);
        console.log(`[AUDIT] AUDIT_VERDICT sent to ${stream}: ${id}`);
        results.push({ stream, id, success: true });
      } catch (error) {
        console.error(`[AUDIT] Failed to send to ${stream}:`, error.message);
        results.push({ stream, error: error.message, success: false });
      }
    }

    return { correlation, results };
  }

  /**
   * Publier automatiquement avant création d'un fichier claim
   */
  async prePublishClaim(claimFile, options = {}) {
    const filename = path.basename(claimFile);
    const links = options.prUrl ? [options.prUrl] : [`/claims/${filename}`];
    
    return await this.publishClaimStatusUpdate({
      ...options,
      event: 'CLAIM_PUBLISHED',
      details: `Claim ${filename} publié`,
      links
    });
  }

  /**
   * Publier automatiquement avant création d'un fichier audit  
   */
  async prePublishAudit(auditFile, verdict = 'APPROVED', options = {}) {
    const filename = path.basename(auditFile);
    const links = [`/audit/${filename}`];
    
    return await this.publishAuditVerdict({
      ...options,
      event: verdict,
      status: verdict === 'APPROVED' ? 'OK' : 'BLOCKED',
      details: `Audit ${filename} - ${verdict.toLowerCase()}`,
      links
    });
  }
}

// Exportation pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaimAuditPublisher;
}

// CLI si lancé directement
if (require.main === module) {
  const publisher = new ClaimAuditPublisher();
  
  const command = process.argv[2];
  const options = {};
  
  // Parse des arguments CLI
  for (let i = 3; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace('--', '');
    const value = process.argv[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }
  
  async function main() {
    try {
      let result;
      
      switch (command) {
        case 'claim':
          result = await publisher.publishClaimStatusUpdate(options);
          break;
        case 'audit-request':
          result = await publisher.publishAuditRequest(options);
          break;
        case 'audit-verdict':
          result = await publisher.publishAuditVerdict(options);
          break;
        default:
          console.log('Usage:');
          console.log('  node claim-audit-publisher.cjs claim --taskId TM-03 --details "Claim published"');
          console.log('  node claim-audit-publisher.cjs audit-request --taskId TM-03 --details "Ready for audit"');
          console.log('  node claim-audit-publisher.cjs audit-verdict --taskId TM-03 --event APPROVED --details "Conformity OK"');
          process.exit(1);
      }
      
      console.log('Result:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    } finally {
      await publisher.disconnect();
    }
  }
  
  main();
}
