#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { 
  ImageTools, 
  GenerateImageSchema, 
  ValidateImageSchema,
  MakeTransparentSchema,
  InspectTransparencySchema,
  CombineImagesSchema,
  TransformImageSchema,
  AdjustImageSchema,
  CompositeImagesSchema,
  BatchProcessSchema
} from './tools.js';

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

  server.registerTool(
    'make_transparent',
    {
      title: 'Make Transparent',
      description: 'Convert image backgrounds to transparent. Removes specified color (white/black/hex) from images for game assets.',
      inputSchema: MakeTransparentSchema.shape
    },
    async (input) => {
      const result = await imageTools.makeTransparent(input as any);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        isError: !result.success
      };
    }
  );

  server.registerTool(
    'inspect_transparency',
    {
      title: 'Inspect Transparency',
      description: 'Analyze image transparency. Reports alpha channel status, transparent pixel percentage, and recommendations.',
      inputSchema: InspectTransparencySchema.shape
    },
    async (input) => {
      try {
        const result = await imageTools.inspectTransparency(input as any);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'combine_images',
    {
      title: 'Combine Images',
      description: 'Stitch multiple images together horizontally, vertically, or in a grid layout. Perfect for creating panoramas, sprite sheets, or image collages.',
      inputSchema: CombineImagesSchema.shape
    },
    async (input) => {
      try {
        const result = await imageTools.combineImages(input as any);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'transform_image',
    {
      title: 'Transform Image',
      description: 'Apply transformations like resize, crop, rotate, flip, and flop to images. Supports multiple operations in a single call.',
      inputSchema: TransformImageSchema.shape
    },
    async (input) => {
      try {
        const result = await imageTools.transformImage(input as any);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'adjust_image',
    {
      title: 'Adjust Image',
      description: 'Apply color and quality adjustments like blur, sharpen, grayscale, tint, brightness, saturation, and hue to images.',
      inputSchema: AdjustImageSchema.shape
    },
    async (input) => {
      try {
        const result = await imageTools.adjustImage(input as any);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'composite_images',
    {
      title: 'Composite Images',
      description: 'Layer multiple images with advanced blending modes and positioning. Create watermarks, overlays, or complex compositions.',
      inputSchema: CompositeImagesSchema.shape
    },
    async (input) => {
      try {
        const result = await imageTools.compositeImages(input as any);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'batch_process',
    {
      title: 'Batch Process Images',
      description: 'Process multiple images at once. Apply resize, format conversion, and naming patterns to entire directories.',
      inputSchema: BatchProcessSchema.shape
    },
    async (input) => {
      try {
        const result = await imageTools.batchProcess(input as any);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: !result.success
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ],
          isError: true
        };
      }
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