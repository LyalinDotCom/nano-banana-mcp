import { z } from 'zod';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import { GeminiClient, GenerateImageOptions, GenerateImageResult } from './gemini-client.js';

import * as path from 'path';

export const GenerateImageSchema = z.object({
  prompt: z.string().optional().describe('Text prompt for generation'),
  images: z.array(z.object({
    data: z.string().describe('Base64 or file path'),
    mimeType: z.string().optional()
  })).optional().describe('Optional input images'),
  outputPath: z.string().describe('Where to save (e.g., "./assets/enemies/boss.png")'),
  count: z.number().min(1).max(10).optional().describe('Generate multiple (1-10, default 1)'),
  makeTransparent: z.boolean().optional().describe('Auto-remove white background after generation'),
  transparencyColor: z.string().optional().describe('Background color to remove (default: white)'),
  options: z.object({
    model: z.string().optional()
  }).optional().describe('Pass-through for any Gemini options')
});

export const ValidateImageSchema = z.object({
  path: z.string().describe('File path to validate')
});

export const MakeTransparentSchema = z.object({
  inputPath: z.string().describe('Image file or directory path'),
  outputPath: z.string().optional().describe('Output path (defaults to input_transparent.png)'),
  backgroundColor: z.string().optional().default('white').describe('Color to make transparent (white/black/hex)'),
  tolerance: z.number().min(0).max(100).optional().default(10).describe('Color matching tolerance %'),
  overwrite: z.boolean().optional().default(false).describe('Overwrite original file')
});

export const InspectTransparencySchema = z.object({
  path: z.string().describe('Image file to inspect')
});

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;
export type ValidateImageInput = z.infer<typeof ValidateImageSchema>;
export type MakeTransparentInput = z.infer<typeof MakeTransparentSchema>;
export type InspectTransparencyInput = z.infer<typeof InspectTransparencySchema>;

export interface ValidateImageResult {
  exists: boolean;
  valid: boolean;
  dimensions?: { width: number; height: number };
  format?: string;
  fileSize?: number;
  error?: string;
}

export interface MakeTransparentResult {
  success: boolean;
  processed: Array<{
    inputPath: string;
    outputPath: string;
    hasTransparency: boolean;
  }>;
  error?: string;
}

export interface InspectTransparencyResult {
  hasAlphaChannel: boolean;
  transparentPixelPercentage: number;
  format: string;
  dimensions: { width: number; height: number };
  dominantBackgroundColor?: string;
  recommendation?: string;
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

      const result = await this.geminiClient.generateImages(options);
      
      // Apply transparency if requested
      if (result.success && result.images && validated.makeTransparent) {
        for (const image of result.images) {
          try {
            await this.makeTransparent({
              inputPath: image.path,
              outputPath: image.path, // Overwrite the generated image
              backgroundColor: validated.transparencyColor || 'white',
              tolerance: 10,
              overwrite: true
            });
          } catch (error: any) {
            console.error(`Failed to apply transparency to ${image.path}:`, error.message);
          }
        }
      }
      
      return result;
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

  async makeTransparent(input: MakeTransparentInput): Promise<MakeTransparentResult> {
    try {
      const validated = MakeTransparentSchema.parse(input);
      const processed: Array<{ inputPath: string; outputPath: string; hasTransparency: boolean }> = [];

      // Check if input is a directory or file
      const stats = await fs.stat(validated.inputPath);
      const files: string[] = [];

      if (stats.isDirectory()) {
        const dirContents = await fs.readdir(validated.inputPath);
        for (const file of dirContents) {
          if (file.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
            files.push(`${validated.inputPath}/${file}`);
          }
        }
      } else {
        files.push(validated.inputPath);
      }

      for (const file of files) {
        try {
          const outputPath = validated.overwrite 
            ? file 
            : validated.outputPath || file.replace(/(\.[^.]+)$/, '_transparent$1');

          // Parse background color
          let bgColor: { r: number; g: number; b: number };
          if (validated.backgroundColor === 'white') {
            bgColor = { r: 255, g: 255, b: 255 };
          } else if (validated.backgroundColor === 'black') {
            bgColor = { r: 0, g: 0, b: 0 };
          } else if (validated.backgroundColor.startsWith('#')) {
            const hex = validated.backgroundColor.slice(1);
            bgColor = {
              r: parseInt(hex.slice(0, 2), 16),
              g: parseInt(hex.slice(2, 4), 16),
              b: parseInt(hex.slice(4, 6), 16)
            };
          } else {
            bgColor = { r: 255, g: 255, b: 255 }; // Default to white
          }

          // Process image with sharp
          const image = sharp(file);
          const metadata = await image.metadata();
          
          // Convert to RGBA if needed
          const processedImage = await image
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const { data, info } = processedImage;
          const tolerance = (validated.tolerance / 100) * 255;

          // Process pixels to add transparency
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel matches background color within tolerance
            if (
              Math.abs(r - bgColor.r) <= tolerance &&
              Math.abs(g - bgColor.g) <= tolerance &&
              Math.abs(b - bgColor.b) <= tolerance
            ) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
          }

          // Save the processed image
          await sharp(data, {
            raw: {
              width: info.width,
              height: info.height,
              channels: 4
            }
          })
          .png()
          .toFile(outputPath);

          processed.push({
            inputPath: file,
            outputPath,
            hasTransparency: true
          });
        } catch (error: any) {
          console.error(`Failed to process ${file}:`, error.message);
        }
      }

      return {
        success: processed.length > 0,
        processed,
        error: processed.length === 0 ? 'No images were processed' : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        processed: [],
        error: error.message
      };
    }
  }

  async inspectTransparency(input: InspectTransparencyInput): Promise<InspectTransparencyResult> {
    try {
      const validated = InspectTransparencySchema.parse(input);
      
      const image = sharp(validated.path);
      const metadata = await image.metadata();
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      let transparentPixels = 0;
      let totalPixels = info.width * info.height;
      const colorCounts: Map<string, number> = new Map();
      
      // Analyze pixels
      for (let i = 0; i < data.length; i += info.channels) {
        const alpha = info.channels === 4 ? data[i + 3] : 255;
        
        if (alpha < 255) {
          transparentPixels++;
        } else if (alpha === 255) {
          // Track opaque pixel colors for dominant background
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const colorKey = `${r},${g},${b}`;
          colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }
      }
      
      // Find dominant background color
      let dominantColor: string | undefined;
      let maxCount = 0;
      for (const [color, count] of colorCounts) {
        if (count > maxCount) {
          maxCount = count;
          const [r, g, b] = color.split(',').map(Number);
          dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
      }
      
      const transparentPercentage = (transparentPixels / totalPixels) * 100;
      const hasAlpha = info.channels === 4;
      
      // Generate recommendation
      let recommendation: string | undefined;
      if (!hasAlpha) {
        recommendation = 'Image lacks alpha channel. Use make_transparent to add transparency.';
      } else if (transparentPercentage === 0) {
        recommendation = `No transparent pixels found. Consider using make_transparent with backgroundColor="${dominantColor || 'white'}".`;
      } else if (transparentPercentage < 5) {
        recommendation = 'Image has minimal transparency. May need adjustment for game assets.';
      }
      
      return {
        hasAlphaChannel: hasAlpha,
        transparentPixelPercentage: parseFloat(transparentPercentage.toFixed(2)),
        format: metadata.format || 'unknown',
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        dominantBackgroundColor: dominantColor,
        recommendation
      };
    } catch (error: any) {
      throw new Error(`Failed to inspect image: ${error.message}`);
    }
  }
}