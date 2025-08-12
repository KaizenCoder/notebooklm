#!/usr/bin/env node
// Vérification rapide de la conformité communication Redis

const { createClient } = require('redis');

async function checkCompliance() {
  console.log('=== VÉRIFICATION CONFORMITÉ COMMUNICATION REDIS ===\n');
  
  const client = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
  
  try {
    await client.connect();
    console.log('✅ Connexion Redis OK\n');
    
    // Vérifier les canaux obligatoires selon ONBOARDING_AI.md
    const requiredStreams = [
      'agents:global',
      'agents:orchestrator', 
      'agents:pair:team03'
    ];
    
    console.log('📊 État des canaux obligatoires:');
    for (const stream of requiredStreams) {
      try {
        const info = await client.sendCommand(['XINFO', 'STREAM', stream]);
        const length = info[1];
        console.log(`  ✅ ${stream}: ${length} messages`);
        
        // Vérifier les messages récents
        const recent = await client.sendCommand(['XREVRANGE', stream, '+', '-', 'COUNT', '3']);
        recent.forEach((msg, i) => {
          const [id, fields] = msg;
          const fieldsObj = {};
          for (let j = 0; j < fields.length; j += 2) {
            fieldsObj[fields[j]] = fields[j + 1];
          }
          console.log(`    ${i + 1}. ${fieldsObj.event || 'unknown'} (${fieldsObj.status || 'unknown'}) - ${fieldsObj.from_agent || 'unknown'}`);
        });
      } catch (error) {
        console.log(`  ⚠️  ${stream}: vide ou inexistant`);
      }
    }
    
    console.log('\n🔍 Vérification compliance CLAIMS_AUDITS_REDIS_POLICY:');
    
    // Vérifier les messages de type STATUS_UPDATE, AUDIT_REQUEST, AUDIT_VERDICT
    const complianceTypes = ['STATUS_UPDATE', 'AUDIT_REQUEST', 'AUDIT_VERDICT', 'HEARTBEAT'];
    const found = {};
    
    for (const stream of requiredStreams) {
      try {
        const messages = await client.sendCommand(['XREVRANGE', stream, '+', '-', 'COUNT', '20']);
        messages.forEach(([id, fields]) => {
          const topic = fields[fields.indexOf('topic') + 1];
          if (complianceTypes.includes(topic)) {
            if (!found[topic]) found[topic] = 0;
            found[topic]++;
          }
        });
      } catch (error) {
        // Stream vide
      }
    }
    
    complianceTypes.forEach(type => {
      const count = found[type] || 0;
      const status = count > 0 ? '✅' : '⚠️ ';
      console.log(`  ${status} ${type}: ${count} messages`);
    });
    
    console.log('\n📋 Conformité aux spécifications:');
    
    // Vérifier champs obligatoires dans messages récents
    const recentGlobal = await client.sendCommand(['XREVRANGE', 'agents:global', '+', '-', 'COUNT', '1']);
    if (recentGlobal.length > 0) {
      const [id, fields] = recentGlobal[0];
      const msg = {};
      for (let j = 0; j < fields.length; j += 2) {
        msg[fields[j]] = fields[j + 1];
      }
      
      const requiredFields = ['from_agent', 'team', 'role', 'topic', 'event', 'status', 'timestamp', 'correlation_id', 'pair_id'];
      let compliantFields = 0;
      
      requiredFields.forEach(field => {
        if (msg[field]) {
          console.log(`  ✅ ${field}: ${msg[field]}`);
          compliantFields++;
        } else {
          console.log(`  ❌ ${field}: manquant`);
        }
      });
      
      console.log(`\n📈 Score conformité: ${compliantFields}/${requiredFields.length} (${Math.round(compliantFields/requiredFields.length*100)}%)`);
      
      if (compliantFields === requiredFields.length) {
        console.log('🎯 CONFORMITÉ COMPLÈTE - Tous les champs obligatoires présents');
      } else {
        console.log('⚠️  CONFORMITÉ PARTIELLE - Certains champs manquants');
      }
    }
    
    console.log('\n✅ VÉRIFICATION TERMINÉE - Communication Redis opérationnelle');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.quit();
  }
}

checkCompliance().catch(console.error);
