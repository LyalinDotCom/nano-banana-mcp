# Setting up Nano Banana with Claude Desktop

Integrate the Nano Banana MCP server with Claude Desktop to generate images directly within your AI conversations.

## Prerequisites

- **Claude Desktop** app installed
- **Node.js 18+** installed
- **Gemini API Key** with image generation access

## Installation

### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g @lyalindotcom/nano-banana-mcp
```

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/nano-banana-mcp.git
cd nano-banana-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

### Step 2: Set up Environment

Create a `.env` file in the project directory:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 3: Configure Claude Desktop

1. Open Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the Nano Banana server configuration:

**For npm installation:**
```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "nano-banana-server",
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**For source installation:**
```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["/absolute/path/to/nano-banana-mcp/dist/server/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Step 4: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. The MCP server will start automatically

## Verifying the Connection

In Claude Desktop, you can verify the server is connected:

1. Start a new conversation
2. Ask: "What MCP tools do you have available?"
3. Claude should list `generate_image` and `validate_image` tools

## Usage Examples

### Basic Image Generation

```
You: Generate an image of a futuristic city with flying cars and save it to my desktop as future-city.png

Claude: I'll generate a futuristic city image for you.

[Generates image]

I've created a futuristic city scene with flying cars and saved it to your desktop as future-city.png. The image features towering skyscrapers, aerial traffic lanes, and a cyberpunk aesthetic.
```

### Creating Game Assets

```
You: I need sprites for my indie game. Can you create:
1. A pixel art warrior at ./sprites/warrior.png
2. A pixel art wizard at ./sprites/wizard.png  
3. A pixel art dragon at ./sprites/dragon.png

Claude: I'll create those pixel art sprites for your game.

[Generates multiple images]

I've generated all three pixel art sprites for your game:
✓ Warrior sprite (64x64) saved to ./sprites/warrior.png
✓ Wizard sprite (64x64) saved to ./sprites/wizard.png
✓ Dragon sprite (128x128) saved to ./sprites/dragon.png
```

### Image Editing

```
You: I have a product photo at ./products/shoe.jpg. Can you remove the background and save it as shoe-nobg.png?

Claude: I'll remove the background from your shoe photo.

[Processes image]

I've removed the background from your shoe photo and saved the result as shoe-nobg.png with a transparent background.
```

## Advanced Configuration

### With Environment Variables

Instead of hardcoding the API key:

```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "nano-banana-server",
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

Then set the environment variable before launching Claude Desktop.

### With Custom Working Directory

```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/nano-banana-mcp",
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### With Debugging

To see server output for debugging:

```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "nano-banana-server",
      "env": {
        "GEMINI_API_KEY": "your-api-key",
        "DEBUG": "true"
      }
    }
  }
}
```

## Common Workflows

### Web Design

```
You: Create a hero section background with abstract gradients for a tech startup. 
Save it as ./website/hero-bg.jpg with dimensions 1920x1080
```

### Logo Design

```
You: Design a minimalist logo for "TechFlow" company with a blue and white color scheme.
Save it as ./branding/techflow-logo.png
```

### Social Media Content

```
You: Generate an Instagram post image about "5 Tips for Productivity" with modern design.
Save it as ./social/productivity-tips.png
```

### Batch Processing

```
You: I need 5 different variations of app icons with different color schemes.
Save them as ./icons/app-icon-1.png through app-icon-5.png
```

## Troubleshooting

### Server Not Connecting

1. **Check the path**: Ensure the path in config is absolute and correct
2. **Verify Node.js**: Run `node --version` to ensure Node.js 18+ is installed
3. **Test manually**: 
   ```bash
   node /path/to/nano-banana-mcp/dist/index.js
   ```
   Should output: "Nano Banana MCP server is running"

### API Key Issues

- Verify your API key has image generation permissions
- Check the key is correctly set in the config or `.env` file
- Ensure no extra spaces or quotes around the key

### Image Generation Fails

- **Quota exceeded**: Check your Gemini API usage limits
- **Invalid paths**: Ensure Claude has write permissions to the output directory
- **Large requests**: Try smaller image counts or simpler prompts

### Windows-Specific Issues

On Windows, use forward slashes or escaped backslashes:
```json
"args": ["C:/Users/username/nano-banana-mcp/dist/index.js"]
// or
"args": ["C:\\Users\\username\\nano-banana-mcp\\dist\\index.js"]
```

## Tips for Best Results

### 1. Be Specific with Paths

```
Good: "Save to ./output/logo.png"
Better: "Save to C:/Users/me/Desktop/project/logo.png"
```

### 2. Describe Desired Output

```
Good: "Generate an image"
Better: "Generate a 1024x1024 PNG image with transparent background"
```

### 3. Use Relative Paths for Projects

When working on a project, use relative paths:
```
./assets/images/hero.png
./src/components/icons/user.svg
```

### 4. Batch Similar Requests

Instead of multiple separate requests:
```
"Generate 5 different button styles for my UI kit, save them as ./ui/button-1.png through button-5.png"
```

## Security Notes

- **API Keys**: Never share your configuration file with API keys
- **File Access**: The server can write to any path accessible to Node.js
- **Trust**: Claude will ask for confirmation before generating images unless you trust the server
- **Watermarks**: All generated images include SynthID watermarks

## Limitations

- Maximum 10 images per generation request
- Images are limited to formats supported by Gemini Flash 2.5
- File size limitations based on your system's available memory
- API rate limits apply based on your Gemini API plan

## Next Steps

- [Explore the full API documentation](../README.md)
- [View example usage patterns](https://github.com/yourusername/nano-banana-examples)
- [Report issues or request features](https://github.com/yourusername/nano-banana-mcp/issues)

---

Built with ❤️ using the Model Context Protocol and Gemini Flash 2.5