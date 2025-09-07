import { GeminiClient } from '../dist/gemini-client.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test configuration
const API_KEY = process.env.GEMINI_API_KEY || 'test-key';
const client = new GeminiClient(API_KEY);

// Color codes for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

async function testScenario(name, testFn) {
  console.log(`\n${YELLOW}Testing: ${name}${RESET}`);
  try {
    const result = await testFn();
    if (result.success === false && result.error) {
      console.log(`${GREEN}✓ Error caught correctly:${RESET}`);
      console.log(`  Code: ${result.error.code}`);
      console.log(`  Message: ${result.error.message}`);
      return true;
    } else {
      console.log(`${RED}✗ Expected error but got success${RESET}`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ Uncaught error: ${error.message}${RESET}`);
    return false;
  }
}

async function verifyTestAssets() {
  // Check if test assets exist
  try {
    await fs.access('./test-assets');
    console.log(`${GREEN}Test assets directory found${RESET}`);
  } catch {
    console.log(`${RED}Test assets not found. Run create-test-images.js first${RESET}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('Starting Error Handling Tests\n');
  console.log('================================');
  
  await verifyTestAssets();
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Non-existent file path
  total++;
  if (await testScenario('Non-existent file path', async () => {
    return await client.generateImages({
      images: [{
        data: './test-assets/non-existent.png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 2: Invalid permissions (trying to read from system directory)
  total++;
  if (await testScenario('Invalid file path', async () => {
    return await client.generateImages({
      images: [{
        data: '/root/secure/image.png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 3: Text file pretending to be image
  total++;
  if (await testScenario('Non-image file (text file with .png extension)', async () => {
    return await client.generateImages({
      images: [{
        data: './test-assets/fake-image.png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 4: Empty file
  total++;
  if (await testScenario('Empty image file', async () => {
    return await client.generateImages({
      images: [{
        data: './test-assets/empty-image.png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 5: Invalid base64 data
  total++;
  if (await testScenario('Invalid base64 string', async () => {
    return await client.generateImages({
      images: [{
        data: 'This is not base64!!!',
        mimeType: 'image/png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 6: Empty base64
  total++;
  if (await testScenario('Empty base64 data', async () => {
    return await client.generateImages({
      images: [{
        data: '',
        mimeType: 'image/png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 7: Valid base64 but not an image
  total++;
  if (await testScenario('Valid base64 but not image data', async () => {
    const textBase64 = Buffer.from('Hello World').toString('base64');
    return await client.generateImages({
      images: [{
        data: textBase64,
        mimeType: 'image/png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 8: Malformed data URL
  total++;
  if (await testScenario('Malformed data URL', async () => {
    return await client.generateImages({
      images: [{
        data: 'data:image/png;notbase64,abcdef'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 9: Multiple images with one bad
  total++;
  if (await testScenario('Multiple images with one invalid', async () => {
    return await client.generateImages({
      images: [
        {
          data: './test-assets/valid-image.png'
        },
        {
          data: './test-assets/non-existent.png'
        }
      ],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 10: Corrupt PNG file
  total++;
  if (await testScenario('Corrupt PNG file (valid header, bad data)', async () => {
    return await client.generateImages({
      images: [{
        data: './test-assets/corrupt-image.png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 11: Truncated image file
  total++;
  if (await testScenario('Truncated PNG file', async () => {
    return await client.generateImages({
      images: [{
        data: './test-assets/truncated-image.png'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Test 12: Binary garbage file
  total++;
  if (await testScenario('Random binary data file', async () => {
    return await client.generateImages({
      images: [{
        data: './test-assets/garbage.bin'
      }],
      outputPath: './test-output.png'
    });
  })) passed++;
  
  // Note: Not cleaning up test-assets as they're reusable
  
  // Results
  console.log('\n================================');
  console.log(`Results: ${passed}/${total} tests passed`);
  if (passed === total) {
    console.log(`${GREEN}✓ All error handling tests passed!${RESET}`);
  } else {
    console.log(`${RED}✗ Some tests failed${RESET}`);
  }
}

runTests().catch(console.error);