#!/usr/bin/env node
// Test de connexion et fonctionnalité Redis Streams
// Vérifie que Redis est opérationnel et teste l'envoi de messages

const { createClient } = require('redis');
const { randomUUID } = require('crypto');

async function testRedis() {
  console.log('=== TEST REDIS STREAMS ===\n');
  
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log(`Connecting to Redis: ${redisUrl}`);
  
  const client = createClient({ url: redisUrl });
  
  client.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis successfully\n');
    
    // Test basique
    await client.ping();
    console.log('✅ PING successful\n');
    
    // Test des canaux selon spécifications ONBOARDING_AI.md
    const testStreams = [
      'agents:global',
      'agents:orchestrator', 
      'agents:pair:team03'
    ];
    
    const timestamp = new Date().toISOString();
    const correlation = randomUUID();
    
    console.log('Testing streams per ONBOARDING_AI.md specifications...\n');
    
    for (const stream of testStreams) {
      try {
        const fields = [
          'from_agent', 'test-orchestrator',
          'team', 'orange',
          'role', 'impl',
          'topic', 'TEST',
          'event', 'CONNECTION_TEST',
          'status', 'OK',
          'severity', 'INFO', 
          'timestamp', timestamp,
          'correlation_id', correlation,
          'task_id', 'redis-test',
          'tm_ids', JSON.stringify(['redis-test']),
          'details', 'Redis streams connectivity test'
        ];
        
        const id = await client.sendCommand(['XADD', stream, '*', ...fields]);
        console.log(`✅ ${stream}: message added with ID ${id}`);
        
        // Lire le dernier message pour vérifier
        const messages = await client.sendCommand(['XREAD', 'COUNT', '1', 'STREAMS', stream, '$']);
        
      } catch (error) {
        console.error(`❌ ${stream}: failed - ${error.message}`);
      }
    }
    
    console.log('\n=== Stream Info ===');
    for (const stream of testStreams) {
      try {
        const info = await client.sendCommand(['XINFO', 'STREAM', stream]);
        const length = info[1]; // length is at index 1
        console.log(`📊 ${stream}: ${length} messages`);
      } catch (error) {
        console.log(`📊 ${stream}: stream not found (empty)`);
      }
    }
    
    // Test de lecture des derniers messages
    console.log('\n=== Recent Messages ===');
    for (const stream of testStreams) {
      try {
        const messages = await client.sendCommand(['XREVRANGE', stream, '+', '-', 'COUNT', '3']);
        console.log(`📝 ${stream}: ${messages.length} recent messages`);
        messages.forEach((msg, i) => {
          const [id, fields] = msg;
          const fieldsObj = {};
          for (let j = 0; j < fields.length; j += 2) {
            fieldsObj[fields[j]] = fields[j + 1];
          }
          console.log(`   ${i + 1}. ${id}: ${fieldsObj.event || 'unknown'} (${fieldsObj.status || 'unknown'})`);
        });
      } catch (error) {
        console.log(`📝 ${stream}: could not read messages`);
      }
    }
    
    console.log('\n✅ Redis Streams test completed successfully');
    
  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message);
    process.exit(1);
  } finally {
    try {
      await client.quit();
      console.log('✅ Redis connection closed\n');
    } catch (error) {
      console.error('⚠️  Error closing Redis connection:', error.message);
    }
  }
}

// Vérification que Redis est disponible
async function checkRedisAvailable() {
  console.log('Checking Redis availability...\n');
  
  try {
    const client = createClient({ 
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      socket: { connectTimeout: 2000 }
    });
    
    await client.connect();
    await client.ping();
    await client.quit();
    
    return true;
  } catch (error) {
    console.error('❌ Redis not available:', error.message);
    console.log('\n🔧 To start Redis locally:');
    console.log('   Windows: Download and run Redis from https://github.com/MicrosoftArchive/redis/releases');
    console.log('   Docker:  docker run -d -p 6379:6379 redis:latest');
    console.log('   WSL:     sudo service redis-server start');
    return false;
  }
}

async function main() {
  const available = await checkRedisAvailable();
  if (!available) {
    process.exit(1);
  }
  
  await testRedis();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testRedis, checkRedisAvailable };
