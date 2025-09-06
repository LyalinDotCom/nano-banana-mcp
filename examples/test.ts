import { ImageTools } from '../src/tools.js';
import dotenv from 'dotenv';

dotenv.config();

async function testImageGeneration() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Please set GEMINI_API_KEY in your .env file');
    return;
  }

  const tools = new ImageTools(apiKey);

  console.log('Testing text-to-image generation...');
  const result1 = await tools.generateImage({
    prompt: 'A cute robot holding a banana in a futuristic setting',
    outputPath: './test-images/robot-banana.png'
  });
  console.log('Result:', JSON.stringify(result1, null, 2));

  if (result1.success && result1.images?.[0]) {
    console.log('\\nValidating generated image...');
    const validation = await tools.validateImage({
      path: result1.images[0].path
    });
    console.log('Validation:', JSON.stringify(validation, null, 2));
  }

  console.log('\\nTesting batch generation...');
  const result2 = await tools.generateImage({
    prompt: 'Different colored gemstones, fantasy game item icons',
    outputPath: './test-images/gemstone.png',
    count: 3
  });
  console.log('Batch result:', JSON.stringify(result2, null, 2));
}

testImageGeneration().catch(console.error);