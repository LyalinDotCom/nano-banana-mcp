# Setting up Nano Banana with Other MCP Clients

The Nano Banana MCP server works with any client that supports the Model Context Protocol. This guide covers integration with various MCP-compatible tools.

## Generic MCP Client Setup

### Prerequisites

- Node.js 18+ installed
- Gemini API key with image generation access
- An MCP-compatible client

### Basic Configuration

Most MCP clients expect a configuration similar to:

```json
{
  "servers": {
    "nano-banana": {
      "transport": "stdio",
      "command": "node",
      "args": ["/path/to/nano-banana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Continue.dev Integration

[Continue](https://continue.dev) is a VS Code extension for AI pair programming.

### Setup

1. Install the Continue extension in VS Code
2. Open VS Code settings (`Cmd/Ctrl + ,`)
3. Search for "Continue: Config"
4. Add to your `~/.continue/config.json`:

```json
{
  "models": [...],
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["/path/to/nano-banana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Usage in VS Code

```
@mcp generate_image Create a UML diagram for a user authentication flow, save to ./docs/auth-flow.png
```

## Cody (Sourcegraph) Integration

### Setup

Add to your Cody configuration:

```json
{
  "mcp": {
    "servers": {
      "nano-banana": {
        "command": "node",
        "args": ["/path/to/nano-banana-mcp/dist/index.js"],
        "env": {
          "GEMINI_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

## Cursor Integration

### Setup

In Cursor settings, add the MCP server:

```json
{
  "mcp_servers": {
    "nano-banana": {
      "command": "node",
      "args": ["/path/to/nano-banana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Zed Editor Integration

### Setup

In your Zed configuration (`~/.config/zed/settings.json`):

```json
{
  "assistant": {
    "mcp_servers": {
      "nano-banana": {
        "command": "node",
        "args": ["/path/to/nano-banana-mcp/dist/index.js"],
        "env": {
          "GEMINI_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

## Custom MCP Client Implementation

If you're building your own MCP client, here's how to connect:

### TypeScript/JavaScript

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function connectToNanoBanana() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/path/to/nano-banana-mcp/dist/index.js'],
    env: {
      ...process.env,
      GEMINI_API_KEY: 'your-api-key'
    }
  });

  const client = new Client({
    name: 'my-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  
  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools);
  
  // Generate an image
  const result = await client.callTool('generate_image', {
    prompt: 'A futuristic robot',
    outputPath: './robot.png'
  });
  
  return client;
}
```

### Python

```python
import asyncio
from mcp import Client, StdioTransport
import subprocess

async def connect_to_nano_banana():
    transport = StdioTransport(
        subprocess.Popen(
            ['node', '/path/to/nano-banana-mcp/dist/index.js'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={'GEMINI_API_KEY': 'your-api-key'}
        )
    )
    
    client = Client("my-client", "1.0.0")
    await client.connect(transport)
    
    # List tools
    tools = await client.list_tools()
    print(f"Available tools: {tools}")
    
    # Generate image
    result = await client.call_tool('generate_image', {
        'prompt': 'A futuristic robot',
        'outputPath': './robot.png'
    })
    
    return client
```

## HTTP Transport Setup

For clients that prefer HTTP over stdio:

### Starting the Server

First, create a simple HTTP wrapper:

```javascript
// http-wrapper.js
const express = require('express');
const { spawn } = require('child_process');
const app = express();

app.use(express.json());

app.post('/mcp', async (req, res) => {
  // Forward to stdio server
  const child = spawn('node', ['/path/to/nano-banana-mcp/dist/index.js'], {
    env: { ...process.env, GEMINI_API_KEY: 'your-api-key' }
  });
  
  child.stdin.write(JSON.stringify(req.body));
  child.stdin.end();
  
  let output = '';
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  child.on('close', () => {
    res.json(JSON.parse(output));
  });
});

app.listen(3000, () => {
  console.log('HTTP MCP bridge running on port 3000');
});
```

### Client Configuration

```json
{
  "servers": {
    "nano-banana": {
      "transport": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Docker Deployment

For containerized environments:

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV GEMINI_API_KEY=""

ENTRYPOINT ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  nano-banana:
    build: .
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./output:/output
    stdin_open: true
    tty: true
```

### Client Configuration for Docker

```json
{
  "servers": {
    "nano-banana": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "GEMINI_API_KEY",
        "-v", "${PWD}:/workspace",
        "nano-banana-mcp:latest"
      ]
    }
  }
}
```

## Testing Your Integration

### Manual Testing with MCP CLI

Install the MCP CLI tool:

```bash
npm install -g @modelcontextprotocol/cli
```

Test the server:

```bash
# List tools
mcp-cli list-tools --server "node /path/to/nano-banana-mcp/dist/index.js"

# Call a tool
mcp-cli call-tool \
  --server "node /path/to/nano-banana-mcp/dist/index.js" \
  --tool generate_image \
  --params '{"prompt":"A test image","outputPath":"./test.png"}'
```

### Automated Testing

Create a test script:

```javascript
// test-integration.js
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testIntegration() {
  console.log('Testing Nano Banana MCP integration...');
  
  try {
    // Connect
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/index.js'],
      env: { GEMINI_API_KEY: process.env.GEMINI_API_KEY }
    });
    
    const client = new Client({ name: 'test', version: '1.0.0' }, {});
    await client.connect(transport);
    console.log('✓ Connected to server');
    
    // List tools
    const tools = await client.listTools();
    console.log(`✓ Found ${tools.tools.length} tools`);
    
    // Test generation
    const result = await client.callTool('generate_image', {
      prompt: 'A simple test pattern',
      outputPath: './test-output.png'
    });
    console.log('✓ Image generation successful');
    
    // Test validation
    const validation = await client.callTool('validate_image', {
      path: './test-output.png'
    });
    console.log('✓ Image validation successful');
    
    await client.close();
    console.log('✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testIntegration();
```

## Common Integration Patterns

### Workspace-Aware Configuration

```json
{
  "servers": {
    "nano-banana": {
      "command": "node",
      "args": ["${workspaceFolder}/nano-banana-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "${env:GEMINI_API_KEY}",
        "OUTPUT_DIR": "${workspaceFolder}/generated-images"
      }
    }
  }
}
```

### Multi-Environment Setup

```json
{
  "development": {
    "servers": {
      "nano-banana": {
        "command": "node",
        "args": ["dist/index.js"],
        "env": {
          "GEMINI_API_KEY": "${env:GEMINI_API_KEY_DEV}",
          "DEBUG": "true"
        }
      }
    }
  },
  "production": {
    "servers": {
      "nano-banana": {
        "command": "docker",
        "args": ["run", "-i", "nano-banana-mcp:latest"],
        "env": {
          "GEMINI_API_KEY": "${env:GEMINI_API_KEY_PROD}"
        }
      }
    }
  }
}
```

## Troubleshooting

### Connection Issues

1. **Verify the server runs standalone**:
   ```bash
   GEMINI_API_KEY=your-key node /path/to/dist/index.js
   ```

2. **Check client logs** for connection errors

3. **Ensure proper JSON communication** over stdio

### Tool Discovery Issues

- Verify the server implements `tools/list` method
- Check that tool schemas are valid JSON Schema
- Ensure tool names are properly formatted

### Execution Failures

- Verify API key has proper permissions
- Check output path write permissions
- Monitor API quota and rate limits

## Building Your Own Client

For complete client implementation examples, see:
- [TypeScript Client Example](https://github.com/modelcontextprotocol/typescript-sdk)
- [Python Client Example](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Specification](https://modelcontextprotocol.io)

## Support

- [GitHub Issues](https://github.com/yourusername/nano-banana-mcp/issues)
- [MCP Community](https://github.com/modelcontextprotocol/community)
- [API Documentation](../README.md)

---

Built with ❤️ using the Model Context Protocol and Gemini Flash 2.5