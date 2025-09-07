import * as fs from 'fs/promises';
import * as path from 'path';

// Create various test images for error handling tests

async function createTestImages() {
  const testDir = './test-assets';
  
  // 1. Valid PNG - small red square (10x10)
  const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';
  await fs.writeFile(path.join(testDir, 'valid-image.png'), Buffer.from(validPngBase64, 'base64'));
  console.log('Created: valid-image.png (valid 10x10 PNG)');
  
  // 2. Valid JPEG - small blue square
  const validJpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCmAA8A/9k=';
  await fs.writeFile(path.join(testDir, 'valid-image.jpg'), Buffer.from(validJpegBase64, 'base64'));
  console.log('Created: valid-image.jpg (valid JPEG)');
  
  // 3. Corrupt image - PNG header but corrupted data
  const corruptPng = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47]), // PNG magic bytes
    Buffer.from('This is corrupted data that is not a valid PNG')
  ]);
  await fs.writeFile(path.join(testDir, 'corrupt-image.png'), corruptPng);
  console.log('Created: corrupt-image.png (PNG header but invalid data)');
  
  // 4. Text file pretending to be image
  await fs.writeFile(path.join(testDir, 'fake-image.png'), 'This is just a text file with a .png extension');
  console.log('Created: fake-image.png (text file with .png extension)');
  
  // 5. Empty file
  await fs.writeFile(path.join(testDir, 'empty-image.png'), '');
  console.log('Created: empty-image.png (0 bytes)');
  
  // 6. Binary garbage (random bytes)
  const garbageData = Buffer.from([
    0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07
  ]);
  await fs.writeFile(path.join(testDir, 'garbage.bin'), garbageData);
  console.log('Created: garbage.bin (random binary data)');
  
  // 7. Truncated PNG (valid header but incomplete)
  const truncatedPng = Buffer.from(validPngBase64, 'base64').subarray(0, 20);
  await fs.writeFile(path.join(testDir, 'truncated-image.png'), truncatedPng);
  console.log('Created: truncated-image.png (incomplete PNG file)');
  
  // 8. HTML file with image extension
  await fs.writeFile(path.join(testDir, 'html-as-image.jpg'), '<html><body>Not an image</body></html>');
  console.log('Created: html-as-image.jpg (HTML content)');
  
  // 9. Valid GIF
  const validGifBase64 = 'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
  await fs.writeFile(path.join(testDir, 'valid-image.gif'), Buffer.from(validGifBase64, 'base64'));
  console.log('Created: valid-image.gif (1x1 transparent GIF)');
  
  // 10. Create a README for the test files
  const readme = `# Test Assets for Error Handling

This directory contains various test files for validating error handling:

## Valid Images
- **valid-image.png** - A valid 10x10 PNG image
- **valid-image.jpg** - A valid JPEG image  
- **valid-image.gif** - A valid 1x1 GIF image

## Invalid/Corrupt Files
- **corrupt-image.png** - Has PNG magic bytes but corrupted data
- **fake-image.png** - Text file with .png extension
- **empty-image.png** - Empty file (0 bytes)
- **garbage.bin** - Random binary data
- **truncated-image.png** - Valid PNG header but incomplete file
- **html-as-image.jpg** - HTML content with .jpg extension

## Test Scenarios
- **non-existent.png** - Reference this in tests for file-not-found errors
`;
  
  await fs.writeFile(path.join(testDir, 'README.md'), readme);
  console.log('\nCreated: README.md');
  
  console.log('\n✓ All test assets created successfully!');
}

createTestImages().catch(console.error);