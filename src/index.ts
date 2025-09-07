#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { ImageTools, GenerateImageSchema, ValidateImageSchema } from './tools.js';

// Suppress dotenv output to prevent MCP protocol issues
const originalLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalLog;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

async function main() {
  const server = new McpServer({
    name: 'nano-banana-mcp',
    version: '1.0.0',
    description: 'MCP server for Gemini Flash 2.5 image generation'
  });

  const imageTools = new ImageTools(apiKey!);

  server.registerTool(
    'generate_image',
    {
      title: 'Generate Image',
      description: 'Generate, edit, or compose images using Gemini Flash 2.5. Supports text-to-image, image editing, and multi-image composition.',
      inputSchema: GenerateImageSchema.shape
    },
    async (input) => {
      const result = await imageTools.generateImage(input as any);
      
      if (result.success && result.images) {
        const imageList = result.images.map((img, i) => 
          `Image ${i + 1}: ${img.path} (${img.size.width}x${img.size.height})`
        ).join('\\n');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'validate_image',
    {
      title: 'Validate Image',
      description: 'Validate that an image file exists and is valid',
      inputSchema: ValidateImageSchema.shape
    },
    async (input) => {
      const result = await imageTools.validateImage(input as any);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        isError: !result.valid
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Nano Banana MCP server is running');
  console.error(`API Key: ${apiKey!.substring(0, 10)}...`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});