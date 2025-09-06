# Nano Banana MCP Server - Agent Documentation

## Project Overview
This is an MCP (Model Context Protocol) server that wraps the Gemini Flash 2.5 image generation API. It provides a clean, unopinionated interface for AI agents to generate, edit, and compose images.

## Key Design Decisions

### Philosophy
- **Minimal wrapper**: No templates, galleries, or opinions - just raw API power
- **Agent autonomy**: The agent decides how to use the tools
- **Direct file placement**: Agent controls where images go in the project structure
- **Clear feedback**: Always return success/error status with actionable information

### Architecture Choices
1. **Two tools only**: `generate_image` and `validate_image` for maximum flexibility
2. **Unified generation tool**: One tool handles all modes (text-to-image, editing, composition)
3. **Batch support built-in**: Generate 1-10 variations with a single call
4. **Path flexibility**: Accept both relative and absolute paths, auto-create directories

## API Details

### Gemini Flash 2.5 Model
- Model ID: `gemini-2.5-flash-image-preview`
- Capabilities:
  - Text-to-image generation
  - Image + text editing (add/remove/modify elements)
  - Multi-image composition and style transfer
  - High-fidelity text rendering in images
  - All images include SynthID watermark

### Tool Specifications

#### generate_image
**Purpose**: Universal image generation tool

**Input Detection Logic**:
- Text only → Text-to-image
- Text + 1 image → Edit existing image
- Text + multiple images → Compose/style transfer
- No text, only images → Style transfer between images

**Batch Generation**:
- When `count` > 1, generates variations
- Files saved as: `name-1.png`, `name-2.png`, etc.
- Each variation uses the same prompt but different seed

**Error Codes**:
- `INVALID_API_KEY`: Auth failure
- `QUOTA_EXCEEDED`: Rate/quota limits
- `API_ERROR`: General API issues
- `INVALID_INPUT`: Parameter validation failed
- `FILE_WRITE_ERROR`: Cannot save to path
- `NO_IMAGES_GENERATED`: API returned no images

#### validate_image
**Purpose**: Verify image generation succeeded

**Validation Checks**:
1. File exists at specified path
2. File is a valid image format
3. Dimensions >= 10x10 pixels
4. Returns actual dimensions for agent use

## Implementation Notes

### Dependencies
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `@google/genai`: Official Gemini SDK
- `sharp`: Fast image validation (C++ bindings)
- `zod`: Runtime type validation
- `dotenv`: Environment configuration

### File Structure
```
src/
├── index.ts          # MCP server setup, tool registration
├── tools.ts          # Tool implementations, Zod schemas
└── gemini-client.ts  # Gemini API wrapper, error handling
```

### Error Handling Strategy
1. Never throw - always return success/error object
2. Catch and categorize all errors (API, file I/O, validation)
3. Provide actionable error messages
4. Include stack traces in details for debugging

### Image Storage
- Agent specifies exact output path
- Server creates parent directories if needed
- Supports any project structure the agent wants
- No opinions on organization

## Usage Patterns

### Game Development
```javascript
// Generate sprite sheets
generate_image({
  prompt: "16-bit warrior sprite, 8 frames of walking animation",
  outputPath: "./assets/sprites/warrior-walk.png"
})

// Create backgrounds
generate_image({
  prompt: "Parallax forest background, 3 layers",
  outputPath: "./assets/bg/forest.png",
  count: 3  // Generate 3 layer variations
})
```

### Web Development
```javascript
// Generate hero images
generate_image({
  prompt: "Modern tech startup hero image, abstract geometric",
  outputPath: "./public/images/hero.jpg"
})

// Create icon sets
generate_image({
  prompt: "Minimalist icon set for productivity app",
  outputPath: "./src/assets/icons/icon.svg",
  count: 10
})
```

### Content Creation
```javascript
// Edit existing photos
generate_image({
  prompt: "Remove the background and make it transparent",
  images: [{ data: "./photos/product.jpg" }],
  outputPath: "./photos/product-nobg.png"
})

// Style transfer
generate_image({
  prompt: "Apply the painting style to the photo",
  images: [
    { data: "./refs/vangogh.jpg" },
    { data: "./photos/landscape.jpg" }
  ],
  outputPath: "./output/stylized.jpg"
})
```

## Testing Checklist

1. **Basic Generation**
   - [ ] Text-to-image works
   - [ ] Returns valid base64 and file path
   - [ ] Image dimensions are correct

2. **Image Editing**
   - [ ] Can modify existing images
   - [ ] Preserves image quality
   - [ ] Style maintained when requested

3. **Batch Generation**
   - [ ] Creates numbered files correctly
   - [ ] All variations are unique
   - [ ] Handles count=1 without suffix

4. **Error Handling**
   - [ ] Invalid API key returns clear error
   - [ ] Quota exceeded handled gracefully
   - [ ] Bad paths return write errors
   - [ ] Missing inputs caught by validation

5. **Path Management**
   - [ ] Creates nested directories
   - [ ] Handles relative paths
   - [ ] Handles absolute paths
   - [ ] Overwrites existing files

## Environment Setup

1. Get Gemini API key from: https://makersuite.google.com/app/apikey
2. Create `.env` file with: `GEMINI_API_KEY=your-key`
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Run: `npm start` or `npm run dev`

## Claude Desktop Integration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["/absolute/path/to/nano-banana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Common Issues

### API Key Issues
- Ensure key has image generation permissions
- Check key isn't expired or revoked
- Verify correct project selected in Google Cloud

### Generation Failures
- API may reject unsafe content
- Very long prompts may fail
- Complex multi-image operations may timeout

### File System Issues
- Ensure write permissions for output paths
- Check disk space for large batch generations
- Verify paths don't contain invalid characters

## Future Considerations

### Potential Enhancements (not implemented)
- Streaming for real-time generation progress
- Caching to avoid regenerating identical prompts
- Webhook support for async generation
- Integration with other Gemini models

### Intentionally Excluded
- Prompt templates (agent should decide)
- Image galleries (agent manages files)
- Style presets (agent controls prompts)
- Automatic retries (agent handles failures)

## Development Commands

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production  
npm run build

# Run tests
npm run dev examples/test.ts

# Start production server
npm start
```

## Version History

### v1.0.0 (Current)
- Initial release
- Two tools: generate_image, validate_image
- Full Gemini Flash 2.5 support
- Batch generation
- Comprehensive error handling