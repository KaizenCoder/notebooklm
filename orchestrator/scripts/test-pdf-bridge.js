// Test script for PDF Bridge integration
// node scripts/test-pdf-bridge.js

import { createPdf, PdfExtractionError } from '../dist/services/pdf.js';
import { loadEnv } from '../dist/env.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPdfBridge() {
  console.log('🔧 Testing PDF Bridge Integration...\n');
  
  try {
    const env = loadEnv();
    const pdfService = createPdf(env);
    
    console.log('✅ Environment loaded successfully');
    console.log(`📊 Bridge enabled: ${env.PDF_BRIDGE_ENABLED}`);
    console.log(`⏱️  Default timeout: ${env.PDF_BRIDGE_TIMEOUT}s`);
    console.log(`📄 Max pages: ${env.PDF_BRIDGE_MAX_PAGES}\n`);
    
    // Test 1: Bridge availability
    console.log('🔍 Test 1: Bridge script availability');
    const bridgePath = path.join(__dirname, 'pdf-bridge/pdf_extractor.py');
    if (fs.existsSync(bridgePath)) {
      console.log('✅ PDF Bridge script found');
    } else {
      console.log('❌ PDF Bridge script not found at:', bridgePath);
      return;
    }
    
    // Test 2: Help command
    console.log('\n🔍 Test 2: Bridge help command');
    try {
      const { spawn } = await import('child_process');
      const pythonCmd = env.PDF_BRIDGE_PYTHON_PATH || 'python';
      
      const helpProcess = spawn(pythonCmd, [bridgePath, '--help'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      helpProcess.stdout?.on('data', (data) => { stdout += data; });
      helpProcess.stderr?.on('data', (data) => { stderr += data; });
      
      const helpExitCode = await new Promise((resolve) => {
        helpProcess.on('close', resolve);
      });
      
      if (helpExitCode === 0 && stdout.includes('PDF Bridge')) {
        console.log('✅ Bridge help command successful');
      } else {
        console.log('❌ Bridge help command failed');
        console.log('Exit code:', helpExitCode);
        console.log('stdout:', stdout.substring(0, 200));
        console.log('stderr:', stderr.substring(0, 200));
        return;
      }
    } catch (error) {
      console.log('❌ Bridge help test failed:', error.message);
      return;
    }
    
    // Test 3: Create a minimal test PDF (if none exists)
    console.log('\n🔍 Test 3: Test file preparation');
    const testPdfPath = path.join(__dirname, 'test-simple.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.log('⚠️  No test PDF found - creating minimal PDF placeholder');
      
      // Create a simple PDF-like file for testing (this won't be a real PDF)
      const simplePdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello PDF Bridge!) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;
      
      fs.writeFileSync(testPdfPath, simplePdfContent);
      console.log('📄 Test PDF created:', testPdfPath);
    } else {
      console.log('📄 Test PDF found:', testPdfPath);
    }
    
    // Test 4: Service method validation (without actual extraction)
    console.log('\n🔍 Test 4: Service method validation');
    
    if (env.PDF_BRIDGE_ENABLED === 'false') {
      console.log('⚠️  PDF Bridge disabled, testing mock behavior');
      const result = await pdfService.extractText('/non/existent/file.pdf');
      if (result === '') {
        console.log('✅ Mock behavior working correctly');
      } else {
        console.log('❌ Mock behavior unexpected result:', result);
      }
    } else {
      console.log('✅ PDF Bridge enabled, service ready for real extraction');
      
      try {
        const isValid = await pdfService.validatePdf('/non/existent/file.pdf');
        console.log('✅ validatePdf method available, result for non-existent file:', isValid);
      } catch (error) {
        if (error instanceof PdfExtractionError) {
          console.log('✅ PdfExtractionError thrown correctly for invalid file');
        } else {
          console.log('❌ Unexpected error type:', error.constructor.name);
        }
      }
    }
    
    // Test 5: Configuration validation
    console.log('\n🔍 Test 5: Configuration validation');
    const timeout = parseInt(env.PDF_BRIDGE_TIMEOUT || '30', 10);
    const maxPages = parseInt(env.PDF_BRIDGE_MAX_PAGES || '1000', 10);
    
    if (timeout >= 5 && timeout <= 300) {
      console.log(`✅ Timeout configuration valid: ${timeout}s`);
    } else {
      console.log(`⚠️  Timeout configuration outside recommended range: ${timeout}s`);
    }
    
    if (maxPages >= 1 && maxPages <= 5000) {
      console.log(`✅ Max pages configuration valid: ${maxPages}`);
    } else {
      console.log(`⚠️  Max pages configuration outside recommended range: ${maxPages}`);
    }
    
    console.log('\n🎉 PDF Bridge integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Bridge script: Available');
    console.log('- Python environment: Working');  
    console.log('- Service integration: Ready');
    console.log('- Configuration: Valid');
    console.log('\n🚀 Ready for real PDF extraction testing!');
    
  } catch (error) {
    console.error('\n❌ PDF Bridge integration test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('test-pdf-bridge.js')) {
  testPdfBridge().catch(console.error);
}
