import { ImageTools } from '../dist/tools.js';
import sharp from 'sharp';
import * as fs from 'fs/promises';

// Create sample images for panorama demo
async function createSampleImages() {
  console.log('Creating sample images...');
  
  await fs.mkdir('./demo-images', { recursive: true });
  
  // Create 3 colored rectangles to simulate panorama pieces
  const colors = [
    { r: 255, g: 100, b: 100, alpha: 1, name: 'red' },
    { r: 100, g: 255, b: 100, alpha: 1, name: 'green' },
    { r: 100, g: 100, b: 255, alpha: 1, name: 'blue' }
  ];
  
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    await sharp({
      create: {
        width: 200,
        height: 150,
        channels: 4,
        background: { r: color.r, g: color.g, b: color.b, alpha: color.alpha }
      }
    })
    .png()
    .toFile(`./demo-images/panel-${i + 1}-${color.name}.png`);
  }
  
  console.log('✓ Created 3 sample images');
}

async function demonstratePanorama() {
  const imageTools = new ImageTools('demo');
  
  console.log('\n=== Panorama Demo ===\n');
  
  // Create horizontal panorama
  console.log('Creating horizontal panorama...');
  const panoramaResult = await imageTools.combineImages({
    images: [
      './demo-images/panel-1-red.png',
      './demo-images/panel-2-green.png',
      './demo-images/panel-3-blue.png'
    ],
    outputPath: './demo-images/panorama-horizontal.png',
    direction: 'horizontal',
    gap: 0,
    backgroundColor: 'transparent'
  });
  
  if (panoramaResult.success) {
    console.log(`✓ Created horizontal panorama: ${panoramaResult.dimensions?.width}x${panoramaResult.dimensions?.height} pixels`);
  }
  
  // Create vertical strip
  console.log('\nCreating vertical strip...');
  const verticalResult = await imageTools.combineImages({
    images: [
      './demo-images/panel-1-red.png',
      './demo-images/panel-2-green.png',
      './demo-images/panel-3-blue.png'
    ],
    outputPath: './demo-images/panorama-vertical.png',
    direction: 'vertical',
    gap: 2,
    backgroundColor: 'white'
  });
  
  if (verticalResult.success) {
    console.log(`✓ Created vertical strip: ${verticalResult.dimensions?.width}x${verticalResult.dimensions?.height} pixels`);
  }
  
  // Create grid layout
  console.log('\nCreating 2x2 grid layout...');
  
  // First create one more image for even grid
  await sharp({
    create: {
      width: 200,
      height: 150,
      channels: 4,
      background: { r: 255, g: 255, b: 100 }
    }
  })
  .png()
  .toFile('./demo-images/panel-4-yellow.png');
  
  const gridResult = await imageTools.combineImages({
    images: [
      './demo-images/panel-1-red.png',
      './demo-images/panel-2-green.png',
      './demo-images/panel-3-blue.png',
      './demo-images/panel-4-yellow.png'
    ],
    outputPath: './demo-images/grid-2x2.png',
    direction: 'grid',
    columns: 2,
    gap: 10,
    backgroundColor: '#f0f0f0'
  });
  
  if (gridResult.success) {
    console.log(`✓ Created 2x2 grid: ${gridResult.dimensions?.width}x${gridResult.dimensions?.height} pixels`);
  }
  
  console.log('\n=== Demo Complete ===');
  console.log('Check the ./demo-images/ directory for output files:');
  console.log('  - panorama-horizontal.png (600x150)');
  console.log('  - panorama-vertical.png (200x454)');
  console.log('  - grid-2x2.png (410x310)');
}

async function main() {
  try {
    await createSampleImages();
    await demonstratePanorama();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

main();