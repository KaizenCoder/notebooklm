#!/usr/bin/env node
// Script pour lister les identifiants des messages Redis avec détails

const { createClient } = require('redis');

async function listMessageIds() {
  console.log('=== IDENTIFIANTS MESSAGES REDIS ===\n');
  
  const client = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
  
  try {
    await client.connect();
    console.log('✅ Connexion Redis OK\n');
    
    const streams = ['agents:global', 'agents:orchestrator', 'agents:pair:team03'];
    
    for (const stream of streams) {
      console.log(`🔍 STREAM: ${stream}`);
      console.log('─'.repeat(60));
      
      try {
        // Lire les 10 derniers messages
        const messages = await client.sendCommand(['XREVRANGE', stream, '+', '-', 'COUNT', '10']);
        
        if (messages.length === 0) {
          console.log('  (aucun message)');
        } else {
          messages.forEach((msg, index) => {
            const [id, fields] = msg;
            const msgObj = {};
            for (let i = 0; i < fields.length; i += 2) {
              msgObj[fields[i]] = fields[i + 1];
            }
            
            console.log(`  ${index + 1}. ID: ${id}`);
            console.log(`     Event: ${msgObj.event || 'N/A'}`);
            console.log(`     Status: ${msgObj.status || 'N/A'}`);
            console.log(`     From: ${msgObj.from_agent || 'N/A'}`);
            console.log(`     Correlation: ${msgObj.correlation_id || 'N/A'}`);
            console.log(`     Timestamp: ${msgObj.timestamp || 'N/A'}`);
            console.log(`     Details: ${msgObj.details || 'N/A'}`);
            console.log('');
          });
        }
        
      } catch (error) {
        console.log(`  ⚠️  Erreur lecture: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Messages spécifiques envoyés aujourd'hui
    console.log('🕐 MESSAGES RÉCENTS (dernières heures)');
    console.log('─'.repeat(60));
    
    const now = Date.now();
    const fourHoursAgo = now - (4 * 60 * 60 * 1000);
    
    for (const stream of streams) {
      try {
        const messages = await client.sendCommand(['XREVRANGE', stream, '+', '-', 'COUNT', '20']);
        const recentMessages = messages.filter(([id]) => {
          // Extraire le timestamp de l'ID Redis (format: timestamp-sequence)
          const timestamp = parseInt(id.split('-')[0]);
          return timestamp > fourHoursAgo;
        });
        
        if (recentMessages.length > 0) {
          console.log(`\n📨 ${stream} (${recentMessages.length} messages récents):`);
          recentMessages.forEach(([id, fields]) => {
            const msgObj = {};
            for (let i = 0; i < fields.length; i += 2) {
              msgObj[fields[i]] = fields[i + 1];
            }
            const timestamp = new Date(parseInt(id.split('-')[0])).toISOString();
            console.log(`  • ${id} | ${msgObj.event || 'N/A'} | ${msgObj.from_agent || 'N/A'} | ${timestamp}`);
          });
        }
      } catch (error) {
        console.log(`  ⚠️  ${stream}: ${error.message}`);
      }
    }
    
    console.log('\n✅ LISTE DES IDENTIFIANTS TERMINÉE');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.quit();
  }
}

listMessageIds().catch(console.error);
