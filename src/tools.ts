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

export const CombineImagesSchema = z.object({
  images: z.array(z.string()).min(2).describe('Array of image file paths to combine'),
  outputPath: z.string().describe('Output file path'),
  direction: z.enum(['horizontal', 'vertical', 'grid']).default('horizontal').describe('How to combine images'),
  gap: z.number().min(0).optional().default(0).describe('Gap between images in pixels'),
  backgroundColor: z.string().optional().default('transparent').describe('Background color (transparent/white/black/hex)'),
  columns: z.number().min(1).optional().describe('Number of columns for grid layout'),
  align: z.enum(['start', 'center', 'end']).optional().default('center').describe('Alignment for images of different sizes')
});

export const TransformImageSchema = z.object({
  inputPath: z.string().describe('Input image file path'),
  outputPath: z.string().describe('Output file path'),
  operations: z.object({
    resize: z.object({
      width: z.number().optional().describe('Target width'),
      height: z.number().optional().describe('Target height'),
      fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional().default('inside')
    }).optional(),
    crop: z.object({
      left: z.number().describe('Left offset'),
      top: z.number().describe('Top offset'),
      width: z.number().describe('Width to extract'),
      height: z.number().describe('Height to extract')
    }).optional(),
    rotate: z.number().min(-360).max(360).optional().describe('Rotation angle in degrees'),
    flip: z.boolean().optional().describe('Flip vertically'),
    flop: z.boolean().optional().describe('Flop horizontally')
  }).describe('Transform operations to apply')
});

export const AdjustImageSchema = z.object({
  inputPath: z.string().describe('Input image file path'),
  outputPath: z.string().describe('Output file path'),
  adjustments: z.object({
    blur: z.number().min(0.3).max(1000).optional().describe('Blur sigma (0.3-1000)'),
    sharpen: z.object({
      sigma: z.number().min(0.5).max(10).optional(),
      m1: z.number().min(0).max(10).optional().default(1),
      m2: z.number().min(0).max(10).optional().default(2),
      x1: z.number().min(0).max(10).optional().default(2),
      y2: z.number().min(0).max(10).optional().default(10),
      y3: z.number().min(0).max(10).optional().default(20)
    }).optional(),
    grayscale: z.boolean().optional().describe('Convert to grayscale'),
    tint: z.string().optional().describe('Tint color (hex format)'),
    brightness: z.number().min(0).max(2).optional().describe('Brightness multiplier (0-2)'),
    saturation: z.number().min(0).max(2).optional().describe('Saturation multiplier (0-2)'),
    hue: z.number().min(-360).max(360).optional().describe('Hue rotation in degrees'),
    normalize: z.boolean().optional().describe('Auto-enhance contrast')
  }).describe('Image adjustments to apply')
});

export const CompositeImagesSchema = z.object({
  baseImage: z.string().describe('Base image file path'),
  overlays: z.array(z.object({
    input: z.string().describe('Overlay image path'),
    gravity: z.enum(['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'center']).optional(),
    left: z.number().optional().describe('Left offset (overrides gravity)'),
    top: z.number().optional().describe('Top offset (overrides gravity)'),
    blend: z.enum(['over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'add', 'subtract']).optional().default('over')
  })).describe('Images to overlay on base'),
  outputPath: z.string().describe('Output file path')
});

export const BatchProcessSchema = z.object({
  inputPath: z.string().describe('Input directory or glob pattern'),
  outputDir: z.string().describe('Output directory'),
  operations: z.object({
    resize: z.object({
      width: z.number().optional(),
      height: z.number().optional()
    }).optional(),
    format: z.enum(['png', 'jpg', 'webp', 'avif']).optional(),
    quality: z.number().min(1).max(100).optional(),
    prefix: z.string().optional().describe('Prefix for output files'),
    suffix: z.string().optional().describe('Suffix for output files')
  }).describe('Operations to apply to all images')
});

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;
export type ValidateImageInput = z.infer<typeof ValidateImageSchema>;
export type MakeTransparentInput = z.infer<typeof MakeTransparentSchema>;
export type InspectTransparencyInput = z.infer<typeof InspectTransparencySchema>;
export type CombineImagesInput = z.infer<typeof CombineImagesSchema>;
export type TransformImageInput = z.infer<typeof TransformImageSchema>;
export type AdjustImageInput = z.infer<typeof AdjustImageSchema>;
export type CompositeImagesInput = z.infer<typeof CompositeImagesSchema>;
export type BatchProcessInput = z.infer<typeof BatchProcessSchema>;

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

export interface CombineImagesResult {
  success: boolean;
  outputPath?: string;
  dimensions?: { width: number; height: number };
  imagesProcessed?: number;
  error?: string;
}

export interface TransformImageResult {
  success: boolean;
  outputPath?: string;
  dimensions?: { width: number; height: number };
  operations?: string[];
  error?: string;
}

export interface AdjustImageResult {
  success: boolean;
  outputPath?: string;
  adjustmentsApplied?: string[];
  error?: string;
}

export interface CompositeImagesResult {
  success: boolean;
  outputPath?: string;
  layersComposited?: number;
  error?: string;
}

export interface BatchProcessResult {
  success: boolean;
  processed: Array<{
    inputPath: string;
    outputPath: string;
    success: boolean;
    error?: string;
  }>;
  totalProcessed: number;
  totalFailed: number;
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

  async combineImages(input: CombineImagesInput): Promise<CombineImagesResult> {
    try {
      const validated = CombineImagesSchema.parse(input);
      
      // Load all images and get their metadata
      const images: Array<{ buffer: Buffer; metadata: sharp.Metadata }> = [];
      for (const imagePath of validated.images) {
        try {
          const buffer = await fs.readFile(imagePath);
          const metadata = await sharp(buffer).metadata();
          images.push({ buffer, metadata });
        } catch (error: any) {
          return {
            success: false,
            error: `Failed to load image ${imagePath}: ${error.message}`
          };
        }
      }

      // Parse background color
      let bgColor: sharp.Color = { r: 0, g: 0, b: 0, alpha: 0 };
      if (validated.backgroundColor !== 'transparent') {
        if (validated.backgroundColor === 'white') {
          bgColor = { r: 255, g: 255, b: 255, alpha: 1 };
        } else if (validated.backgroundColor === 'black') {
          bgColor = { r: 0, g: 0, b: 0, alpha: 1 };
        } else if (validated.backgroundColor.startsWith('#')) {
          const hex = validated.backgroundColor.slice(1);
          bgColor = {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
            alpha: 1
          };
        }
      }

      let finalImage: sharp.Sharp;
      let finalWidth = 0;
      let finalHeight = 0;

      if (validated.direction === 'horizontal') {
        // Calculate total dimensions
        const maxHeight = Math.max(...images.map(img => img.metadata.height || 0));
        const totalWidth = images.reduce((sum, img, idx) => 
          sum + (img.metadata.width || 0) + (idx > 0 ? validated.gap : 0), 0);
        
        finalWidth = totalWidth;
        finalHeight = maxHeight;

        // Create base image
        finalImage = sharp({
          create: {
            width: totalWidth,
            height: maxHeight,
            channels: 4,
            background: bgColor
          }
        });

        // Composite images horizontally
        const composites: sharp.OverlayOptions[] = [];
        let currentX = 0;
        
        for (const img of images) {
          const yOffset = validated.align === 'start' ? 0 :
                         validated.align === 'end' ? maxHeight - (img.metadata.height || 0) :
                         Math.floor((maxHeight - (img.metadata.height || 0)) / 2);
          
          composites.push({
            input: img.buffer,
            left: currentX,
            top: yOffset
          });
          
          currentX += (img.metadata.width || 0) + validated.gap;
        }
        
        finalImage = finalImage.composite(composites);
        
      } else if (validated.direction === 'vertical') {
        // Calculate total dimensions
        const maxWidth = Math.max(...images.map(img => img.metadata.width || 0));
        const totalHeight = images.reduce((sum, img, idx) => 
          sum + (img.metadata.height || 0) + (idx > 0 ? validated.gap : 0), 0);
        
        finalWidth = maxWidth;
        finalHeight = totalHeight;

        // Create base image
        finalImage = sharp({
          create: {
            width: maxWidth,
            height: totalHeight,
            channels: 4,
            background: bgColor
          }
        });

        // Composite images vertically
        const composites: sharp.OverlayOptions[] = [];
        let currentY = 0;
        
        for (const img of images) {
          const xOffset = validated.align === 'start' ? 0 :
                         validated.align === 'end' ? maxWidth - (img.metadata.width || 0) :
                         Math.floor((maxWidth - (img.metadata.width || 0)) / 2);
          
          composites.push({
            input: img.buffer,
            left: xOffset,
            top: currentY
          });
          
          currentY += (img.metadata.height || 0) + validated.gap;
        }
        
        finalImage = finalImage.composite(composites);
        
      } else { // grid
        const columns = validated.columns || Math.ceil(Math.sqrt(images.length));
        const rows = Math.ceil(images.length / columns);
        
        const cellWidth = Math.max(...images.map(img => img.metadata.width || 0));
        const cellHeight = Math.max(...images.map(img => img.metadata.height || 0));
        
        finalWidth = cellWidth * columns + validated.gap * (columns - 1);
        finalHeight = cellHeight * rows + validated.gap * (rows - 1);

        // Create base image
        finalImage = sharp({
          create: {
            width: finalWidth,
            height: finalHeight,
            channels: 4,
            background: bgColor
          }
        });

        // Composite images in grid
        const composites: sharp.OverlayOptions[] = [];
        
        for (let i = 0; i < images.length; i++) {
          const col = i % columns;
          const row = Math.floor(i / columns);
          const img = images[i];
          
          const xBase = col * (cellWidth + validated.gap);
          const yBase = row * (cellHeight + validated.gap);
          
          const xOffset = validated.align === 'start' ? xBase :
                         validated.align === 'end' ? xBase + cellWidth - (img.metadata.width || 0) :
                         xBase + Math.floor((cellWidth - (img.metadata.width || 0)) / 2);
          
          const yOffset = validated.align === 'start' ? yBase :
                         validated.align === 'end' ? yBase + cellHeight - (img.metadata.height || 0) :
                         yBase + Math.floor((cellHeight - (img.metadata.height || 0)) / 2);
          
          composites.push({
            input: img.buffer,
            left: xOffset,
            top: yOffset
          });
        }
        
        finalImage = finalImage.composite(composites);
      }

      // Save the combined image
      await finalImage.toFile(validated.outputPath);
      
      return {
        success: true,
        outputPath: validated.outputPath,
        dimensions: { width: finalWidth, height: finalHeight },
        imagesProcessed: images.length
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async transformImage(input: TransformImageInput): Promise<TransformImageResult> {
    try {
      const validated = TransformImageSchema.parse(input);
      const operations: string[] = [];
      
      let image = sharp(validated.inputPath);
      
      // Apply crop first if specified
      if (validated.operations.crop) {
        const { left, top, width, height } = validated.operations.crop;
        image = image.extract({ left, top, width, height });
        operations.push(`crop(${left},${top},${width}x${height})`);
      }
      
      // Apply resize
      if (validated.operations.resize) {
        const { width, height, fit } = validated.operations.resize;
        image = image.resize(width, height, { fit: fit as any });
        operations.push(`resize(${width || 'auto'}x${height || 'auto'},${fit})`);
      }
      
      // Apply rotation
      if (validated.operations.rotate !== undefined) {
        image = image.rotate(validated.operations.rotate);
        operations.push(`rotate(${validated.operations.rotate}°)`);
      }
      
      // Apply flip (vertical)
      if (validated.operations.flip) {
        image = image.flip();
        operations.push('flip');
      }
      
      // Apply flop (horizontal)
      if (validated.operations.flop) {
        image = image.flop();
        operations.push('flop');
      }
      
      // Save and get metadata
      await image.toFile(validated.outputPath);
      const metadata = await sharp(validated.outputPath).metadata();
      
      return {
        success: true,
        outputPath: validated.outputPath,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        operations
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async adjustImage(input: AdjustImageInput): Promise<AdjustImageResult> {
    try {
      const validated = AdjustImageSchema.parse(input);
      const adjustmentsApplied: string[] = [];
      
      let image = sharp(validated.inputPath);
      
      // Apply blur
      if (validated.adjustments.blur !== undefined) {
        image = image.blur(validated.adjustments.blur);
        adjustmentsApplied.push(`blur(${validated.adjustments.blur})`);
      }
      
      // Apply sharpen
      if (validated.adjustments.sharpen) {
        const s = validated.adjustments.sharpen;
        if (s.sigma !== undefined) {
          image = image.sharpen({
            sigma: s.sigma,
            m1: s.m1,
            m2: s.m2,
            x1: s.x1,
            y2: s.y2,
            y3: s.y3
          });
          adjustmentsApplied.push(`sharpen(σ=${s.sigma})`);
        }
      }
      
      // Apply grayscale
      if (validated.adjustments.grayscale) {
        image = image.grayscale();
        adjustmentsApplied.push('grayscale');
      }
      
      // Apply tint
      if (validated.adjustments.tint) {
        const hex = validated.adjustments.tint.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        image = image.tint({ r, g, b });
        adjustmentsApplied.push(`tint(${validated.adjustments.tint})`);
      }
      
      // Apply modulate for brightness, saturation, hue
      const modulate: any = {};
      if (validated.adjustments.brightness !== undefined) {
        modulate.brightness = validated.adjustments.brightness;
        adjustmentsApplied.push(`brightness(${validated.adjustments.brightness})`);
      }
      if (validated.adjustments.saturation !== undefined) {
        modulate.saturation = validated.adjustments.saturation;
        adjustmentsApplied.push(`saturation(${validated.adjustments.saturation})`);
      }
      if (validated.adjustments.hue !== undefined) {
        modulate.hue = validated.adjustments.hue;
        adjustmentsApplied.push(`hue(${validated.adjustments.hue}°)`);
      }
      if (Object.keys(modulate).length > 0) {
        image = image.modulate(modulate);
      }
      
      // Apply normalize
      if (validated.adjustments.normalize) {
        image = image.normalize();
        adjustmentsApplied.push('normalize');
      }
      
      // Save the adjusted image
      await image.toFile(validated.outputPath);
      
      return {
        success: true,
        outputPath: validated.outputPath,
        adjustmentsApplied
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async compositeImages(input: CompositeImagesInput): Promise<CompositeImagesResult> {
    try {
      const validated = CompositeImagesSchema.parse(input);
      
      let baseImage = sharp(validated.baseImage);
      const baseMetadata = await baseImage.metadata();
      
      const composites: sharp.OverlayOptions[] = [];
      
      for (const overlay of validated.overlays) {
        const overlayBuffer = await fs.readFile(overlay.input);
        
        const options: sharp.OverlayOptions = {
          input: overlayBuffer,
          blend: overlay.blend as any
        };
        
        // Use specific coordinates if provided
        if (overlay.left !== undefined && overlay.top !== undefined) {
          options.left = overlay.left;
          options.top = overlay.top;
        } else if (overlay.gravity) {
          // Use gravity positioning
          options.gravity = overlay.gravity as any;
        }
        
        composites.push(options);
      }
      
      // Apply all composites
      baseImage = baseImage.composite(composites);
      
      // Save the composited image
      await baseImage.toFile(validated.outputPath);
      
      return {
        success: true,
        outputPath: validated.outputPath,
        layersComposited: validated.overlays.length
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async batchProcess(input: BatchProcessInput): Promise<BatchProcessResult> {
    try {
      const validated = BatchProcessSchema.parse(input);
      const processed: BatchProcessResult['processed'] = [];
      
      // Get list of files to process
      let files: string[] = [];
      const stats = await fs.stat(validated.inputPath);
      
      if (stats.isDirectory()) {
        const dirContents = await fs.readdir(validated.inputPath);
        files = dirContents
          .filter(file => file.match(/\.(png|jpg|jpeg|gif|webp|avif|tiff)$/i))
          .map(file => path.join(validated.inputPath, file));
      } else if (stats.isFile()) {
        files = [validated.inputPath];
      }
      
      // Ensure output directory exists
      await fs.mkdir(validated.outputDir, { recursive: true });
      
      // Process each file
      for (const file of files) {
        try {
          let image = sharp(file);
          const basename = path.basename(file, path.extname(file));
          const ext = validated.operations.format ? `.${validated.operations.format}` : path.extname(file);
          
          // Apply resize if specified
          if (validated.operations.resize) {
            const { width, height } = validated.operations.resize;
            image = image.resize(width, height);
          }
          
          // Apply format conversion
          if (validated.operations.format) {
            switch (validated.operations.format) {
              case 'jpg':
                image = image.jpeg({ quality: validated.operations.quality || 80 });
                break;
              case 'png':
                image = image.png();
                break;
              case 'webp':
                image = image.webp({ quality: validated.operations.quality || 80 });
                break;
              case 'avif':
                image = image.avif({ quality: validated.operations.quality || 80 });
                break;
            }
          }
          
          // Generate output filename
          const prefix = validated.operations.prefix || '';
          const suffix = validated.operations.suffix || '';
          const outputName = `${prefix}${basename}${suffix}${ext}`;
          const outputPath = path.join(validated.outputDir, outputName);
          
          // Save the processed image
          await image.toFile(outputPath);
          
          processed.push({
            inputPath: file,
            outputPath,
            success: true
          });
        } catch (error: any) {
          processed.push({
            inputPath: file,
            outputPath: '',
            success: false,
            error: error.message
          });
        }
      }
      
      const totalProcessed = processed.filter(p => p.success).length;
      const totalFailed = processed.filter(p => !p.success).length;
      
      return {
        success: totalFailed === 0,
        processed,
        totalProcessed,
        totalFailed
      };
      
    } catch (error: any) {
      return {
        success: false,
        processed: [],
        totalProcessed: 0,
        totalFailed: 0
      };
    }
  }
}