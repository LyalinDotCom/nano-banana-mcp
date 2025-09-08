# Nano Banana MCP Server

![Nano Banana Logo](https://raw.githubusercontent.com/LyalinDotCom/nano-banana-mcp/main/nano-banana-mcp.png)

A Model Context Protocol (MCP) server that provides powerful image generation capabilities using Google's Gemini Flash 2.5 model. This server acts as a clean wrapper around the Gemini API, enabling AI agents to generate, edit, and compose images through simple tool calls.

## ✨ See It In Action

```bash
# With Gemini CLI - Just use natural language!
$ gemini chat
> Create a cyberpunk robot holding a banana, save it to ./robot.png

🤖 Generating your cyberpunk robot image...
✅ Image saved to ./robot.png (1024x1024)

> Now make 5 color variations
🤖 Creating 5 variations...
✅ Generated: robot-1.png, robot-2.png, robot-3.png, robot-4.png, robot-5.png
```

## 🚀 Quick Start with Popular Tools

### [Gemini CLI](docs/gemini-cli-setup.md) (Recommended)
The most powerful integration - use natural language to generate images directly from your terminal:
```bash
gemini chat
> "Create a cyberpunk city at night and save it to ./art/city.png"
```
[📖 Full Gemini CLI Setup Guide →](docs/gemini-cli-setup.md)

### [Codex CLI](docs/codex-cli-setup.md)
Powerful Rust-based CLI with CI/CD support and advanced automation:
```bash
codex exec --full-auto "Generate complete asset pipeline for v2.0 release"
```
[📖 Full Codex CLI Setup Guide →](docs/codex-cli-setup.md)

### [Claude Desktop](docs/claude-desktop-setup.md)
Integrate with Claude's desktop app for image generation in your conversations:
```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["/path/to/nano-banana-mcp/dist/index.js"]
    }
  }
}
```
[📖 Full Claude Desktop Setup Guide →](docs/claude-desktop-setup.md)

### [Other MCP Clients](docs/other-clients.md)
Works with any MCP-compatible client. [See integration examples →](docs/other-clients.md)

## Features

### 🎨 Image Generation (Powered by Gemini Flash 2.5)
- **Text-to-Image Generation**: Create images from text descriptions
- **Image Editing**: Modify existing images with text prompts
- **Multi-Image Composition**: Combine multiple images or transfer styles
- **Batch Generation**: Generate multiple variations at once

### 🛠️ Image Manipulation (Powered by Sharp)
- **Combine Images**: Stitch images into panoramas, grids, or strips
- **Transform Images**: Resize, crop, rotate, flip, and flop
- **Adjust Images**: Blur, sharpen, grayscale, tint, brightness, saturation
- **Composite Images**: Layer images with blend modes and positioning
- **Batch Processing**: Apply operations to entire directories

### 🔧 Developer Features
- **NPX Support**: Run without installation using `npx -p @lyalindotcom/nano-banana-mcp nano-banana`
- **Smart Path Handling**: Automatically creates directories and handles file paths
- **Image Validation**: Verify generated images are valid and meet size requirements
- **Comprehensive Error Handling**: Clear feedback on API errors, quota issues, and failures
- **MCP Protocol**: Works with any MCP-compatible AI client

## 🚀 Quick Install (1 Minute!)

### Option 1: NPX (Recommended - No Installation!)
```bash
# Set up with Gemini CLI (interactive wizard)
npx -p @lyalindotcom/nano-banana-mcp nano-banana setup

# Or quick setup with API key
npx -p @lyalindotcom/nano-banana-mcp nano-banana setup --api-key YOUR_GEMINI_KEY

# Then use with Gemini CLI
gemini chat
```

### Option 2: Global Install
```bash
# Install globally
npm install -g @lyalindotcom/nano-banana-mcp

# Set up with Gemini CLI
nano-banana setup --api-key YOUR_GEMINI_KEY

# Then use with Gemini CLI
gemini chat
```

### Option 3: From Source
```bash
# Clone the repo
git clone https://github.com/yourusername/nano-banana-mcp.git
cd nano-banana-mcp

# Run the quickstart script - it does EVERYTHING!
./quickstart.sh

# That's it! Start using it:
gemini chat
> "Create a robot holding a banana at ./robot.png"
```

The quickstart script will:
- ✅ Check Node.js version
- ✅ Install Gemini CLI if needed
- ✅ Build the project
- ✅ Configure your API key
- ✅ Set up Gemini CLI integration
- ✅ Verify everything works

## Installation Options

### Option 1: Automatic Setup with CLI (Recommended)

Our CLI tool handles everything for you:

```bash
# After cloning and installing
cd nano-banana-mcp
npm install

# Run interactive setup
npm run setup
```

The wizard will:
- ✅ Check prerequisites (Node.js 18+, Gemini CLI)
- ✅ Auto-detect installations
- ✅ Configure your API key securely
- ✅ Test the server works
- ✅ Create automatic backups

### Option 2: Manual Setup

1. **Configure API key:**
   ```bash
   cp .env.example .env
   # Edit .env with your GEMINI_API_KEY
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Add to Gemini CLI manually** (see [docs/gemini-cli-setup.md](docs/gemini-cli-setup.md))

Get your API key from: https://makersuite.google.com/app/apikey

## CLI Commands

The Nano Banana CLI provides powerful management tools:

```bash
# Interactive setup wizard (configures Gemini CLI integration)
nano-banana setup

# Create .env file with API key (does NOT configure Gemini CLI)
nano-banana init --api-key YOUR_KEY

# Start the MCP server directly (for manual testing)
nano-banana serve

# Check installation status
nano-banana status

# Diagnose any issues
nano-banana doctor

# Safely remove configuration
nano-banana remove
```

**Important:** Use `setup` to configure with Gemini CLI. The `init` command only creates a `.env` file.

## Usage

Once configured, just use natural language with Gemini CLI:

```bash
gemini chat
```

Then ask for images:
- "Generate a cyberpunk city at ./city.png"
- "Create 5 potion icons at ./items/potions.png"
- "Add a sunset to ./photo.jpg"

## 🌟 Why Nano Banana?

- **🎨 Full Gemini Flash 2.5 Power**: Access the latest image generation capabilities
- **🚀 Natural Language Interface**: Just describe what you want
- **🔧 Flexible Integration**: Works with Gemini CLI, Claude Desktop, and any MCP client
- **📁 Direct File Management**: Images save exactly where you need them
- **🎯 Smart Context**: One tool handles generation, editing, and composition
- **⚡ Batch Operations**: Generate up to 10 variations at once

## 📚 Documentation

- **[Gemini CLI Setup](docs/gemini-cli-setup.md)** - The most powerful integration
- **[Codex CLI Setup](docs/codex-cli-setup.md)** - Advanced automation and CI/CD workflows  
- **[Claude Desktop Setup](docs/claude-desktop-setup.md)** - Use with Claude's desktop app
- **[Other MCP Clients](docs/other-clients.md)** - VS Code, Continue, Cursor, and more
- **[API Reference](#available-tools)** - Detailed tool documentation

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

## 🎮 Real-World Use Cases

### Game Development
```bash
> Generate a complete set of 16-bit RPG sprites: warrior, mage, archer at ./sprites/
> Create terrain tiles for a top-down game: grass, stone, water at ./tiles/
> Design UI elements: health bars, mana bars, inventory slots at ./ui/
```

### Web Development
```bash
> Create a hero section background with gradients at ./public/hero.jpg
> Generate a set of feature icons for my SaaS landing page at ./icons/
> Design social media cards for my blog posts at ./social/
```

### Content Creation
```bash
> Generate YouTube thumbnail about "AI Revolution" at ./thumbnails/ai.jpg
> Create Instagram carousel about productivity tips at ./instagram/
> Design presentation diagrams for cloud architecture at ./slides/
```

## 🛠️ Requirements

- **Node.js** 18 or higher
- **Gemini API Key** with image generation access ([Get one here](https://makersuite.google.com/app/apikey))
- **TypeScript** 5.0+ (for development)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with the [Model Context Protocol](https://modelcontextprotocol.io)
- Powered by [Gemini Flash 2.5](https://deepmind.google/technologies/gemini/)
- Inspired by the amazing MCP community

## 🔗 Links

- [GitHub Repository](https://github.com/yourusername/nano-banana-mcp)
- [Report Issues](https://github.com/yourusername/nano-banana-mcp/issues)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Codex CLI](https://github.com/openai/codex)
- [MCP Specification](https://modelcontextprotocol.io)

---

<p align="center">
  Made with ❤️ and 🍌 by a Nano Banana fan
</p>
