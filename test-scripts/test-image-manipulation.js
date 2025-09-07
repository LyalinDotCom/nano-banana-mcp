import { ImageTools } from '../dist/tools.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test configuration
const imageTools = new ImageTools('test-key'); // We're testing local operations, no API key needed

// Color codes for output
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function setupTestImages() {
  console.log(`${YELLOW}Setting up test images...${RESET}`);
  
  // Create output directory
  await fs.mkdir('./test-output', { recursive: true });
  
  // Check if test assets exist
  try {
    await fs.access('./test-assets');
  } catch {
    console.log(`${RED}Test assets not found. Please run create-test-images.js first${RESET}`);
    process.exit(1);
  }
}

async function testCombineImages() {
  console.log(`\n${YELLOW}Testing combine_images...${RESET}`);
  
  // Test horizontal combination
  console.log('  - Horizontal stitch');
  const horizontalResult = await imageTools.combineImages({
    images: [
      './test-assets/valid-image.png',
      './test-assets/valid-image.jpg',
      './test-assets/valid-image.gif'
    ],
    outputPath: './test-output/combined-horizontal.png',
    direction: 'horizontal',
    gap: 10,
    backgroundColor: '#f0f0f0',
    align: 'center'
  });
  
  if (horizontalResult.success) {
    console.log(`    ${GREEN}✓ Created: ${horizontalResult.outputPath} (${horizontalResult.dimensions?.width}x${horizontalResult.dimensions?.height})${RESET}`);
  } else {
    console.log(`    ${RED}✗ Failed: ${horizontalResult.error}${RESET}`);
  }
  
  // Test vertical combination
  console.log('  - Vertical stitch');
  const verticalResult = await imageTools.combineImages({
    images: [
      './test-assets/valid-image.png',
      './test-assets/valid-image.jpg'
    ],
    outputPath: './test-output/combined-vertical.png',
    direction: 'vertical',
    gap: 5,
    backgroundColor: 'white'
  });
  
  if (verticalResult.success) {
    console.log(`    ${GREEN}✓ Created: ${verticalResult.outputPath}${RESET}`);
  }
  
  // Test grid layout
  console.log('  - Grid layout');
  const gridResult = await imageTools.combineImages({
    images: [
      './test-assets/valid-image.png',
      './test-assets/valid-image.jpg',
      './test-assets/valid-image.gif',
      './test-assets/valid-image.png'
    ],
    outputPath: './test-output/combined-grid.png',
    direction: 'grid',
    columns: 2,
    gap: 15,
    backgroundColor: 'transparent'
  });
  
  if (gridResult.success) {
    console.log(`    ${GREEN}✓ Created: ${gridResult.outputPath} (${gridResult.imagesProcessed} images)${RESET}`);
  }
}

async function testTransformImage() {
  console.log(`\n${YELLOW}Testing transform_image...${RESET}`);
  
  // Test resize
  console.log('  - Resize');
  const resizeResult = await imageTools.transformImage({
    inputPath: './test-assets/valid-image.png',
    outputPath: './test-output/transformed-resize.png',
    operations: {
      resize: {
        width: 50,
        height: 50,
        fit: 'cover'
      }
    }
  });
  
  if (resizeResult.success) {
    console.log(`    ${GREEN}✓ Applied: ${resizeResult.operations?.join(', ')}${RESET}`);
  }
  
  // Test multiple transforms
  console.log('  - Multiple transforms');
  const multiResult = await imageTools.transformImage({
    inputPath: './test-assets/valid-image.jpg',
    outputPath: './test-output/transformed-multi.png',
    operations: {
      resize: { width: 30 },
      rotate: 45,
      flip: true
    }
  });
  
  if (multiResult.success) {
    console.log(`    ${GREEN}✓ Applied: ${multiResult.operations?.join(', ')}${RESET}`);
  }
}

async function testAdjustImage() {
  console.log(`\n${YELLOW}Testing adjust_image...${RESET}`);
  
  // Test blur
  console.log('  - Blur');
  const blurResult = await imageTools.adjustImage({
    inputPath: './test-assets/valid-image.png',
    outputPath: './test-output/adjusted-blur.png',
    adjustments: {
      blur: 5
    }
  });
  
  if (blurResult.success) {
    console.log(`    ${GREEN}✓ Applied: ${blurResult.adjustmentsApplied?.join(', ')}${RESET}`);
  }
  
  // Test multiple adjustments
  console.log('  - Multiple adjustments');
  const multiAdjustResult = await imageTools.adjustImage({
    inputPath: './test-assets/valid-image.jpg',
    outputPath: './test-output/adjusted-multi.png',
    adjustments: {
      grayscale: true,
      brightness: 1.2,
      sharpen: { sigma: 2 }
    }
  });
  
  if (multiAdjustResult.success) {
    console.log(`    ${GREEN}✓ Applied: ${multiAdjustResult.adjustmentsApplied?.join(', ')}${RESET}`);
  }
  
  // Test tint
  console.log('  - Tint');
  const tintResult = await imageTools.adjustImage({
    inputPath: './test-assets/valid-image.png',
    outputPath: './test-output/adjusted-tint.png',
    adjustments: {
      tint: '#ff6600'
    }
  });
  
  if (tintResult.success) {
    console.log(`    ${GREEN}✓ Applied: ${tintResult.adjustmentsApplied?.join(', ')}${RESET}`);
  }
}

async function testCompositeImages() {
  console.log(`\n${YELLOW}Testing composite_images...${RESET}`);
  
  // First create a larger base image for compositing
  await imageTools.transformImage({
    inputPath: './test-assets/valid-image.png',
    outputPath: './test-output/base-for-composite.png',
    operations: {
      resize: { width: 100, height: 100 }
    }
  });
  
  // Test overlay with gravity
  console.log('  - Overlay with gravity');
  const overlayResult = await imageTools.compositeImages({
    baseImage: './test-output/base-for-composite.png',
    overlays: [
      {
        input: './test-assets/valid-image.gif',
        gravity: 'southeast'
      },
      {
        input: './test-assets/valid-image.jpg',
        gravity: 'northwest'
      }
    ],
    outputPath: './test-output/composited.png'
  });
  
  if (overlayResult.success) {
    console.log(`    ${GREEN}✓ Composited ${overlayResult.layersComposited} layers${RESET}`);
  }
}

async function testBatchProcess() {
  console.log(`\n${YELLOW}Testing batch_process...${RESET}`);
  
  // Test batch resize and format conversion
  console.log('  - Batch resize and convert');
  const batchResult = await imageTools.batchProcess({
    inputPath: './test-assets',
    outputDir: './test-output/batch',
    operations: {
      resize: { width: 32, height: 32 },
      format: 'webp',
      quality: 85,
      prefix: 'thumb_',
      suffix: '_processed'
    }
  });
  
  if (batchResult.success) {
    console.log(`    ${GREEN}✓ Processed: ${batchResult.totalProcessed} files${RESET}`);
    if (batchResult.totalFailed > 0) {
      console.log(`    ${YELLOW}⚠ Failed: ${batchResult.totalFailed} files${RESET}`);
    }
  } else {
    console.log(`    ${RED}✗ Batch processing failed${RESET}`);
  }
  
  // Show processed files
  if (batchResult.processed.length > 0) {
    console.log('    Processed files:');
    batchResult.processed.slice(0, 3).forEach(file => {
      if (file.success) {
        console.log(`      - ${path.basename(file.outputPath)}`);
      }
    });
    if (batchResult.processed.length > 3) {
      console.log(`      ... and ${batchResult.processed.length - 3} more`);
    }
  }
}

async function cleanupTestOutput() {
  console.log(`\n${YELLOW}Test output files created in ./test-output/${RESET}`);
  console.log('To clean up, run: rm -rf ./test-output');
}

async function runTests() {
  console.log(`${GREEN}=== Image Manipulation Tools Test ===${RESET}`);
  
  try {
    await setupTestImages();
    await testCombineImages();
    await testTransformImage();
    await testAdjustImage();
    await testCompositeImages();
    await testBatchProcess();
    await cleanupTestOutput();
    
    console.log(`\n${GREEN}✓ All tests completed successfully!${RESET}`);
  } catch (error) {
    console.error(`\n${RED}Test failed with error:${RESET}`, error);
    process.exit(1);
  }
}

runTests();