# Setting up Nano Banana with Gemini CLI

The Gemini CLI provides the most powerful integration for the Nano Banana MCP server, allowing you to generate images using natural language directly from your terminal.

## Prerequisites

- **Node.js 18+** installed
- **Gemini CLI** installed ([Installation Guide](https://github.com/google-gemini/gemini-cli))
- **Gemini API Key** with image generation access

## Installation

### Step 1: Clone and Build

```bash
# Clone the repository
git clone https://github.com/yourusername/nano-banana-mcp.git
cd nano-banana-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

### Step 2: Configure Environment

Create a `.env` file with your Gemini API key:

```bash
echo "GEMINI_API_KEY=your-api-key-here" > .env
```

### Step 3: Add to Gemini CLI

**For npm installation (recommended):**

```bash
# First install globally
npm install -g @lyalindotcom/nano-banana-mcp

# Then run setup
nano-banana setup
```

**For manual configuration:**

Edit `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "nano-banana-server",
      "env": {
        "GEMINI_API_KEY": "$GEMINI_API_KEY"
      },
      "timeout": 60000,
      "trust": true
    }
  }
}
```

### Step 4: Verify Connection

```bash
# Check server status
gemini mcp list

# Or in chat mode
gemini chat
/mcp
```

You should see:
```
✓ nano-banana: command: node /path/to/nano-banana-mcp/dist/index.js (stdio) - Connected
  Tools: generate_image, validate_image
```

## Usage Examples

### Interactive Chat Mode

Start an interactive session:

```bash
gemini chat
```

Then use natural language:

```
> Generate a futuristic robot holding a banana and save it to ./robot.png

> Create 5 different potion icons for my game at ./assets/potions.png

> Add a sunset to the photo at ./landscape.jpg

> Combine the art style from ./style.jpg with ./portrait.jpg
```

### Direct Commands

Use the Gemini CLI directly:

```bash
# Generate a single image
gemini "Create a logo for 'Nano Banana' with a futuristic theme, save to ./logo.png"

# Generate multiple variations
gemini "Generate 3 different sci-fi spaceship designs at ./ships.png"

# Edit existing images
gemini "Remove the background from ./product.jpg and save to ./product-nobg.png"
```

## Real-World Workflows

### Game Development

```bash
gemini chat

# Generate character sprites
> Create a 16-bit pixel art warrior sprite at ./sprites/warrior.png

# Generate tile sets
> Generate a set of grass, stone, and water tiles for a top-down RPG at ./tiles/terrain.png

# Create UI elements
> Design fantasy-themed health and mana bars at ./ui/bars.png
```

### Web Development

```bash
# Hero images
> Generate a modern tech startup hero image with abstract shapes at ./public/hero.jpg

# Icon sets
> Create a set of 10 minimalist icons for a productivity app at ./icons/set.png

# Backgrounds
> Generate a subtle gradient background with geometric patterns at ./bg/pattern.png
```

### Content Creation

```bash
# Blog illustrations
> Create an illustration about AI and creativity at ./blog/ai-creativity.png

# Social media graphics
> Design an Instagram post about sustainable living at ./social/eco-post.png

# Presentation assets
> Generate a professional diagram showing cloud architecture at ./slides/architecture.png
```

## Advanced Features

### Batch Generation

Generate multiple variations efficiently:

```bash
gemini chat
> I need 5 different enemy sprites for my game. Generate goblins, orcs, skeletons, zombies, and dragons at ./enemies/
```

The model will intelligently call the tool multiple times or use the count parameter.

### Image Editing Pipeline

Chain operations together:

```bash
> Take the logo at ./logo.png and:
  1. Create a version with a blue color scheme at ./logo-blue.png
  2. Create a version with a vintage effect at ./logo-vintage.png
  3. Create a simplified icon version at ./logo-icon.png
```

### Style Transfer

Apply artistic styles to your images:

```bash
> Apply Van Gogh's starry night style to my photo at ./photo.jpg, save to ./artistic.jpg
```

## Tips and Best Practices

### 1. Organize Your Outputs

```bash
# Use descriptive paths
> Generate a hero character at ./game/characters/hero/idle.png
> Generate attack animation frames at ./game/characters/hero/attack-{n}.png
```

### 2. Leverage Natural Language

The Gemini model understands context:

```bash
> I'm building a space game. Generate a spaceship.
# Model understands the sci-fi context

> Make it more menacing
# Model remembers the previous context
```

### 3. Validate Generated Images

```bash
> Check all images in ./output/ are valid and meet size requirements
```

### 4. Use Environment Variables

Set up your API key once:

```bash
export GEMINI_API_KEY="your-key"
# Now it's available to all sessions
```

## Troubleshooting

### Server Connection Issues

```bash
# Test the server directly
node /path/to/nano-banana-mcp/dist/index.js

# Check with debug mode
gemini --debug chat

# Verify in MCP status
gemini mcp list
```

### Generation Failures

Common solutions:
- **Quota errors**: Check your Gemini API quota
- **Invalid paths**: Ensure write permissions
- **Large batches**: Reduce count parameter

### Performance Optimization

```json
{
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["dist/index.js"],
      "timeout": 120000,  // Increase for large batches
      "trust": true        // Skip confirmations
    }
  }
}
```

## Security Considerations

- **API Keys**: Never commit `.env` files
- **Trust Settings**: Only use `trust: true` for your own servers
- **File Access**: The server can write anywhere Node.js has permissions
- **Generated Content**: All images include SynthID watermarks

## Integration with Other Tools

### VS Code

```bash
# Generate and immediately open in VS Code
gemini "Create a diagram of my system architecture at ./docs/arch.png" && code ./docs/arch.png
```

### Git Workflows

```bash
# Generate assets for a new feature
gemini "Generate UI mockups for a login screen at ./design/login.png"
git add ./design/login.png
git commit -m "Add login screen mockups"
```

### CI/CD Pipelines

```yaml
# In your GitHub Actions workflow
- name: Generate Documentation Images
  run: |
    gemini "Create architecture diagram at ./docs/images/architecture.png"
    gemini "Create flow chart at ./docs/images/flow.png"
```

## Next Steps

- [Explore the full API](../README.md#available-tools)
- [View example projects](https://github.com/yourusername/nano-banana-examples)
- [Report issues](https://github.com/yourusername/nano-banana-mcp/issues)
- [Contribute](https://github.com/yourusername/nano-banana-mcp/pulls)

---

Built with ❤️ using the Model Context Protocol and Gemini Flash 2.5