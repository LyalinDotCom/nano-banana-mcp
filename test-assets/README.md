# Test Assets for Error Handling

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
