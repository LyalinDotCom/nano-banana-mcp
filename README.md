# Nano Banana MCP Server

![Nano Banana Logo](nano-banana-mcp.png)

A Model Context Protocol (MCP) server that provides powerful image generation capabilities using Google's Gemini Flash 2.5 model. This server acts as a clean wrapper around the Gemini API, enabling AI agents to generate, edit, and compose images through simple tool calls.

## Features

- **Text-to-Image Generation**: Create images from text descriptions
- **Image Editing**: Modify existing images with text prompts
- **Multi-Image Composition**: Combine multiple images or transfer styles
- **Batch Generation**: Generate multiple variations at once
- **Smart Path Handling**: Automatically creates directories and handles file paths
- **Image Validation**: Verify generated images are valid and meet size requirements
- **Comprehensive Error Handling**: Clear feedback on API errors, quota issues, and failures

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Gemini API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

## Configuration

Create a `.env` file with your Gemini API key:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

Get your API key from: https://makersuite.google.com/app/apikey

## Usage

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

### Configuring with Claude Desktop

Add this to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["/path/to/nano-banana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### generate_image

Generate, edit, or compose images using Gemini Flash 2.5.

**Parameters:**
- `prompt` (optional): Text description for generation
- `images` (optional): Array of input images (base64 or file paths)
- `outputPath`: Where to save the generated image(s)
- `count` (optional): Number of variations to generate (1-10)
- `options` (optional): Additional Gemini model options

**Examples:**

Text-to-image:
```javascript
{
  "prompt": "A cyberpunk city at night with neon lights",
  "outputPath": "./assets/backgrounds/city.png"
}
```

Image editing:
```javascript
{
  "prompt": "Add a rainbow in the sky",
  "images": [{ "data": "./photos/landscape.jpg" }],
  "outputPath": "./photos/landscape-rainbow.jpg"
}
```

Batch generation:
```javascript
{
  "prompt": "Fantasy potion bottles, different colors",
  "outputPath": "./items/potion.png",
  "count": 5
}
```

### validate_image

Check if an image file exists and is valid.

**Parameters:**
- `path`: File path to validate

**Returns:**
- `exists`: Whether the file exists
- `valid`: Whether it's a valid image
- `dimensions`: Image width and height
- `format`: Image format (png, jpeg, etc.)
- `fileSize`: File size in bytes
- `error`: Error message if validation failed

## How It Works

1. **Flexible Input**: The server intelligently determines the operation mode:
   - Text only → Text-to-image generation
   - Text + 1 image → Image editing
   - Text + multiple images → Composition/style transfer

2. **Path Management**: Automatically creates directories and handles both absolute and relative paths

3. **Batch Support**: When `count` > 1, generates multiple variations with numbered suffixes

4. **Validation**: Uses Sharp to verify images are properly generated and meet minimum size requirements

## Error Handling

The server provides detailed error information:
- `INVALID_API_KEY`: Authentication failed
- `QUOTA_EXCEEDED`: API limits reached
- `API_ERROR`: General API failure
- `INVALID_INPUT`: Bad parameters
- `FILE_WRITE_ERROR`: Cannot save to path
- `VALIDATION_FAILED`: Image corrupt or too small

## Testing

Run the example test script:
```bash
npm run dev examples/test.ts
```

This will test:
- Basic text-to-image generation
- Image validation
- Batch generation

## Project Structure

```
nano-banana-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── tools.ts          # Tool implementations
│   └── gemini-client.ts  # Gemini API wrapper
├── examples/
│   └── test.ts           # Example usage
├── .env.example          # Environment template
└── README.md             # This file
```

## Requirements

- Node.js 18+
- Gemini API key with image generation access
- TypeScript 5.0+

## License

MIT