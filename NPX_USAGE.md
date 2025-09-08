# NPX Usage Guide for Nano Banana MCP

## 🚀 Quick Start with NPX (No Installation Required!)

You can use Nano Banana MCP directly with NPX without installing it globally. This is perfect for:
- Quick one-time setups
- CI/CD pipelines
- Testing the latest version
- Avoiding global package pollution

## Basic NPX Commands

### 1. Initialize a New Project
```bash
# Create a new project with .env file
npx @lyalindotcom/nano-banana-mcp init --api-key YOUR_GEMINI_API_KEY
```

### 2. Set Up with Your AI Client
```bash
# Interactive setup wizard
npx @lyalindotcom/nano-banana-mcp setup

# Non-interactive setup with flags
npx @lyalindotcom/nano-banana-mcp setup --api-key YOUR_KEY --trust
```

### 3. Run the MCP Server Directly
```bash
# Start the server (reads .env or uses --api-key)
npx @lyalindotcom/nano-banana-mcp serve

# With explicit API key
npx @lyalindotcom/nano-banana-mcp serve --api-key YOUR_KEY
```

### 4. Check Status
```bash
# Check installation and configuration
npx @lyalindotcom/nano-banana-mcp status
```

## Installation Options

### Option 1: NPX (No Install)
Best for one-time use or testing:
```bash
npx @lyalindotcom/nano-banana-mcp@latest serve
```

### Option 2: Global Install
Best for frequent use:
```bash
npm install -g @lyalindotcom/nano-banana-mcp
nano-banana serve
```

### Option 3: Project Dependency
Best for project-specific setups:
```bash
npm install --save-dev @lyalindotcom/nano-banana-mcp
npx nano-banana serve
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Generate Images
on: [push]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Generate images with Nano Banana
        run: |
          npx nano-banana-mcp serve &
          SERVER_PID=$!
          # Your image generation commands here
          kill $SERVER_PID
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

### Docker Example
```dockerfile
FROM node:18-alpine
WORKDIR /app

# No installation needed!
ENV GEMINI_API_KEY=your_key_here

# Run directly with npx
CMD ["npx", "nano-banana-mcp", "serve"]
```

## Advanced NPX Usage

### Use Specific Version
```bash
# Use a specific version
npx nano-banana-mcp@1.0.0 serve

# Use beta version
npx nano-banana-mcp@beta serve

# Always use latest
npx nano-banana-mcp@latest serve
```

### Run Without Cache
```bash
# Force fresh download (useful for testing)
npx --no-cache nano-banana-mcp serve
```

### Specify Node Version
```bash
# Use with specific Node version
npx --node-version=18 nano-banana-mcp serve
```

## Troubleshooting

### Issue: Command not found
```bash
# Make sure you have npx installed
npm install -g npx
```

### Issue: API Key not found
```bash
# Option 1: Use .env file
echo "GEMINI_API_KEY=your_key" > .env
npx nano-banana-mcp serve

# Option 2: Use environment variable
GEMINI_API_KEY=your_key npx nano-banana-mcp serve

# Option 3: Use command flag
npx nano-banana-mcp serve --api-key your_key
```

### Issue: Permission denied
```bash
# Run with sudo if needed (not recommended)
sudo npx nano-banana-mcp setup

# Better: fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## Environment Variables

The server recognizes these environment variables:
- `GEMINI_API_KEY` - Your Gemini API key (required)
- `MCP_REQUEST_TIMEOUT` - Request timeout in ms (default: 60000)
- `NODE_ENV` - Set to 'production' for optimized performance

## Examples

### Quick Image Generation Script
```bash
#!/bin/bash
# generate-images.sh

# Start server in background
npx nano-banana-mcp serve &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Your image generation commands here
# (using your MCP client)

# Clean up
kill $SERVER_PID
```

### Project Setup Script
```javascript
// setup.js
const { execSync } = require('child_process');

// Initialize project
execSync('npx nano-banana-mcp init --api-key ' + process.env.GEMINI_API_KEY);

// Set up with AI client
execSync('npx nano-banana-mcp setup --trust --no-interactive');

console.log('✅ Nano Banana MCP is ready!');
```

## Benefits of NPX

1. **Zero Installation**: No global packages needed
2. **Always Latest**: Automatically uses the latest version
3. **Clean System**: No package pollution
4. **CI/CD Friendly**: Perfect for automated pipelines
5. **Version Flexibility**: Easy to test different versions
6. **Cross-Platform**: Works on Windows, Mac, and Linux

## Publishing to npm

When ready to publish:
```bash
# Build the package
npm run build

# Test locally
npm link
nano-banana --version

# Publish to npm
npm publish

# Or publish beta
npm publish --tag beta
```

## Support

- GitHub Issues: [github.com/yourusername/nano-banana-mcp/issues](https://github.com/yourusername/nano-banana-mcp/issues)
- NPM Package: [npmjs.com/package/@lyalindotcom/nano-banana-mcp](https://www.npmjs.com/package/@lyalindotcom/nano-banana-mcp)
- Documentation: [github.com/yourusername/nano-banana-mcp#readme](https://github.com/yourusername/nano-banana-mcp#readme)