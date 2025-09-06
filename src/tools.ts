import { z } from 'zod';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import { GeminiClient, GenerateImageOptions, GenerateImageResult } from './gemini-client.js';

export const GenerateImageSchema = z.object({
  prompt: z.string().optional().describe('Text prompt for generation'),
  images: z.array(z.object({
    data: z.string().describe('Base64 or file path'),
    mimeType: z.string().optional()
  })).optional().describe('Optional input images'),
  outputPath: z.string().describe('Where to save (e.g., "./assets/enemies/boss.png")'),
  count: z.number().min(1).max(10).optional().describe('Generate multiple (1-10, default 1)'),
  options: z.object({
    model: z.string().optional()
  }).optional().describe('Pass-through for any Gemini options')
});

export const ValidateImageSchema = z.object({
  path: z.string().describe('File path to validate')
});

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;
export type ValidateImageInput = z.infer<typeof ValidateImageSchema>;

export interface ValidateImageResult {
  exists: boolean;
  valid: boolean;
  dimensions?: { width: number; height: number };
  format?: string;
  fileSize?: number;
  error?: string;
}

export class ImageTools {
  private geminiClient: GeminiClient;

  constructor(apiKey: string) {
    this.geminiClient = new GeminiClient(apiKey);
  }

  async generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
    try {
      const validated = GenerateImageSchema.parse(input);
      
      if (!validated.prompt && (!validated.images || validated.images.length === 0)) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Either prompt or images must be provided'
          }
        };
      }

      const options: GenerateImageOptions = {
        prompt: validated.prompt,
        images: validated.images,
        outputPath: validated.outputPath,
        count: validated.count,
        options: validated.options
      };

      return await this.geminiClient.generateImages(options);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid input parameters',
            details: error.errors
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
          details: error.stack
        }
      };
    }
  }

  async validateImage(input: ValidateImageInput): Promise<ValidateImageResult> {
    try {
      const validated = ValidateImageSchema.parse(input);
      
      try {
        await fs.access(validated.path);
      } catch {
        return {
          exists: false,
          valid: false,
          error: 'File does not exist'
        };
      }

      try {
        const metadata = await sharp(validated.path).metadata();
        const stats = await fs.stat(validated.path);
        
        if (!metadata.width || !metadata.height) {
          return {
            exists: true,
            valid: false,
            error: 'Image has invalid dimensions'
          };
        }
        
        if (metadata.width < 10 || metadata.height < 10) {
          return {
            exists: true,
            valid: false,
            dimensions: { width: metadata.width, height: metadata.height },
            error: 'Image is too small (less than 10x10 pixels)'
          };
        }
        
        return {
          exists: true,
          valid: true,
          dimensions: { 
            width: metadata.width, 
            height: metadata.height 
          },
          format: metadata.format,
          fileSize: stats.size
        };
      } catch (error: any) {
        return {
          exists: true,
          valid: false,
          error: `Invalid image file: ${error.message}`
        };
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          exists: false,
          valid: false,
          error: 'Invalid input parameters'
        };
      }
      
      return {
        exists: false,
        valid: false,
        error: error.message || 'An unknown error occurred'
      };
    }
  }
}