# Setting up Nano Banana with Codex CLI

[Codex CLI](https://github.com/openai/codex) is a powerful Rust-based CLI that supports MCP servers through its TOML configuration. This guide shows how to integrate Nano Banana with Codex for AI-powered image generation.

## Prerequisites

- **Node.js 18+** installed
- **Codex CLI** installed ([Installation Guide](https://github.com/openai/codex))
- **Gemini API Key** with image generation access
- **OpenAI API Key** for Codex operations

## Installation

### Step 1: Install Codex CLI

```bash
# Install via npm
npm install -g @openai/codex

# Or via cargo if you have Rust installed
cargo install codex-cli
```

### Step 2: Clone and Build Nano Banana

```bash
# Clone the repository
git clone https://github.com/yourusername/nano-banana-mcp.git
cd nano-banana-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

### Step 3: Configure Environment

Create a `.env` file in the nano-banana-mcp directory:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

## Configuration

### Step 1: Configure Codex

Edit your Codex configuration file at `~/.codex/config.toml`:

```toml
# Basic Codex configuration
[model]
provider = "openai"
name = "gpt-4-turbo-preview"

# MCP Server configuration
[mcp_servers.nano-banana]
command = "node"
args = ["/absolute/path/to/nano-banana-mcp/dist/index.js"]
env = { GEMINI_API_KEY = "your-gemini-api-key-here" }
```

### Step 2: Using Environment Variables

For better security, use environment variables:

```toml
[mcp_servers.nano-banana]
command = "node"
args = ["/absolute/path/to/nano-banana-mcp/dist/index.js"]
env = { GEMINI_API_KEY = "${GEMINI_API_KEY}" }
```

Then set the environment variable:

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
export OPENAI_API_KEY="your-openai-api-key-here"
```

## Usage Examples

### Interactive Mode

Start Codex in interactive mode:

```bash
codex chat
```

Then use natural language to generate images:

```
> Use the nano-banana server to generate a cyberpunk city at ./city.png

> Create 5 different fantasy potion icons and save them to ./potions/

> Edit the photo at ./landscape.jpg to add a sunset effect
```

### Non-Interactive Mode

Execute commands directly:

```bash
# Single image generation
codex exec "Use nano-banana to create a logo for 'TechCorp' at ./logo.png"

# Multiple operations
codex exec "Generate game assets: create a warrior sprite at ./sprites/warrior.png, a wizard at ./sprites/wizard.png, and a dragon at ./sprites/dragon.png"

# Batch generation
codex exec "Use nano-banana to generate 10 different icon variations for my app at ./icons/"
```

### Full Auto Mode (CI/CD)

For automated pipelines without confirmation prompts:

```bash
codex exec --full-auto "Generate all required assets for the v2.0 release: hero image at ./marketing/hero.jpg, feature icons at ./icons/, and social media cards at ./social/"
```

## Advanced Usage

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Generate Release Assets

on:
  release:
    types: [created]

jobs:
  generate-assets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: |
          npm install -g @openai/codex
          git clone https://github.com/yourusername/nano-banana-mcp.git
          cd nano-banana-mcp && npm install && npm run build
      
      - name: Generate Release Assets
        run: |
          export OPENAI_API_KEY="${{ secrets.OPENAI_KEY }}"
          export GEMINI_API_KEY="${{ secrets.GEMINI_KEY }}"
          
          # Configure Codex
          mkdir -p ~/.codex
          cat > ~/.codex/config.toml << EOF
          [mcp_servers.nano-banana]
          command = "node"
          args = ["$(pwd)/nano-banana-mcp/dist/index.js"]
          env = { GEMINI_API_KEY = "${GEMINI_API_KEY}" }
          EOF
          
          # Generate assets
          codex exec --full-auto "Generate release banner at ./assets/release-banner.png with version ${{ github.event.release.tag_name }}"
          codex exec --full-auto "Create social media cards for the release at ./social/"
      
      - name: Upload Assets
        uses: actions/upload-artifact@v3
        with:
          name: release-assets
          path: |
            ./assets/
            ./social/
```

#### GitLab CI Example

```yaml
generate-assets:
  stage: build
  image: node:18
  script:
    - npm install -g @openai/codex
    - git clone https://github.com/yourusername/nano-banana-mcp.git
    - cd nano-banana-mcp && npm install && npm run build && cd ..
    - |
      cat > ~/.codex/config.toml << EOF
      [mcp_servers.nano-banana]
      command = "node"
      args = ["$(pwd)/nano-banana-mcp/dist/index.js"]
      env = { GEMINI_API_KEY = "${GEMINI_API_KEY}" }
      EOF
    - codex exec --full-auto "Generate CI/CD pipeline visualization at ./docs/pipeline.png"
  artifacts:
    paths:
      - ./docs/pipeline.png
```

### Logging and Debugging

#### Enable Verbose Logging

```bash
# Set logging level
export RUST_LOG=codex_core=debug,codex_tui=debug

# Run Codex with detailed logs
codex chat

# Monitor logs in another terminal
tail -F ~/.codex/log/codex-tui.log
```

#### Debug MCP Connection

```bash
# Test with maximum verbosity
RUST_LOG=trace codex exec "Test nano-banana connection by generating a simple test image at ./test.png"
```

### Complex Workflows

#### Multi-Step Image Processing

```toml
# ~/.codex/config.toml
[mcp_servers.nano-banana]
command = "node"
args = ["/path/to/nano-banana-mcp/dist/index.js"]
env = { GEMINI_API_KEY = "${GEMINI_API_KEY}" }

[workflows.asset-pipeline]
steps = [
  "Generate base sprites",
  "Create variations",
  "Validate all images"
]
```

Usage:

```bash
codex exec "Execute asset-pipeline workflow: 
1. Generate base character sprites at ./sprites/base/
2. Create 3 color variations of each sprite
3. Validate all generated images meet quality standards"
```

#### Batch Processing Script

Create a script `generate-assets.sh`:

```bash
#!/bin/bash

# Generate all game assets
codex exec --full-auto "Generate player character sprite at ./assets/player.png"
codex exec --full-auto "Generate 5 enemy sprites at ./assets/enemies/"
codex exec --full-auto "Generate 10 item icons at ./assets/items/"
codex exec --full-auto "Generate title screen background at ./assets/title-bg.jpg"

# Validate all generated assets
codex exec --full-auto "Use nano-banana to validate all images in ./assets/"
```

### Using Codex as an MCP Server

Codex itself can act as an MCP server:

```bash
# Launch Codex as an MCP server
codex mcp

# Or inspect it with the MCP inspector
npx @modelcontextprotocol/inspector codex mcp
```

This allows other MCP clients to use Codex's capabilities.

## Configuration Examples

### Development Environment

```toml
# ~/.codex/config.toml
[model]
provider = "openai"
name = "gpt-4-turbo-preview"

[mcp_servers.nano-banana-dev]
command = "node"
args = ["/path/to/nano-banana-mcp/dist/index.js"]
env = { 
  GEMINI_API_KEY = "${GEMINI_API_KEY_DEV}",
  DEBUG = "true"
}
```

### Production Environment

```toml
# ~/.codex/config.toml
[model]
provider = "openai"
name = "gpt-4"

[mcp_servers.nano-banana-prod]
command = "docker"
args = ["run", "-i", "--rm", "nano-banana-mcp:latest"]
env = { 
  GEMINI_API_KEY = "${GEMINI_API_KEY_PROD}"
}
```

### Multiple MCP Servers

```toml
# ~/.codex/config.toml
[mcp_servers.nano-banana]
command = "node"
args = ["/path/to/nano-banana-mcp/dist/index.js"]
env = { GEMINI_API_KEY = "${GEMINI_API_KEY}" }

[mcp_servers.database]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sqlite", "~/data.db"]

[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
```

## Troubleshooting

### Connection Issues

1. **Verify Codex installation**:
   ```bash
   codex --version
   ```

2. **Check configuration**:
   ```bash
   cat ~/.codex/config.toml
   ```

3. **Test MCP server directly**:
   ```bash
   node /path/to/nano-banana-mcp/dist/index.js
   ```

4. **Enable debug logging**:
   ```bash
   RUST_LOG=debug codex chat
   ```

### Common Errors

#### "MCP server not found"
- Ensure the path in `config.toml` is absolute
- Verify Node.js is in your PATH
- Check file permissions

#### "API key invalid"
- Verify GEMINI_API_KEY is set correctly
- Check for extra spaces or quotes
- Ensure the key has image generation permissions

#### "Timeout during generation"
- Increase timeout in server configuration
- Check network connectivity
- Verify API quota hasn't been exceeded

### Performance Optimization

```toml
[mcp_servers.nano-banana]
command = "node"
args = ["--max-old-space-size=4096", "/path/to/nano-banana-mcp/dist/index.js"]
env = { 
  GEMINI_API_KEY = "${GEMINI_API_KEY}",
  NODE_ENV = "production"
}
```

## Best Practices

### 1. Organize Assets by Project

```bash
codex exec "For project 'GameX': create hero at ./GameX/assets/hero.png, enemies at ./GameX/assets/enemies/, and backgrounds at ./GameX/assets/bg/"
```

### 2. Use Descriptive Prompts

```bash
# Good
codex exec "Generate a 1024x1024 PNG logo with transparent background for 'TechCorp' using blue and silver colors at ./logo.png"

# Better than
codex exec "Make a logo"
```

### 3. Batch Similar Operations

```bash
codex exec --full-auto "Generate complete icon set: home, settings, profile, search, notifications - all as 64x64 PNGs at ./icons/"
```

### 4. Validate Generated Content

```bash
codex exec "Generate assets then validate: create 10 sprites at ./sprites/, then use nano-banana to verify all images are valid and meet size requirements"
```

## Integration with Other Tools

### VS Code Integration

```bash
# Generate and open in VS Code
codex exec "Create a system diagram at ./docs/system.png" && code ./docs/system.png
```

### Git Workflow

```bash
# Generate assets for new feature
codex exec "Generate UI mockups for login feature at ./design/login/"
git add ./design/login/
git commit -m "Add login UI mockups"
```

### Docker Compose

```yaml
version: '3.8'

services:
  codex:
    image: codex-cli:latest
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - RUST_LOG=info
    volumes:
      - ./output:/workspace
      - ./config.toml:/root/.codex/config.toml
    command: exec --full-auto "Generate all marketing assets"
```

## Next Steps

- [Explore Nano Banana API](../README.md#available-tools)
- [Learn more about Codex CLI](https://github.com/openai/codex)
- [View MCP Specification](https://modelcontextprotocol.io)
- [Report Issues](https://github.com/yourusername/nano-banana-mcp/issues)

---

Built with ❤️ using the Model Context Protocol, Codex CLI, and Gemini Flash 2.5