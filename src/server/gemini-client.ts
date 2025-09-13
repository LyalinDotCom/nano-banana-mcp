import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

export interface ImageInput {
  data: string;
  mimeType?: string;
}

export interface GenerateImageOptions {
  prompt?: string;
  images?: ImageInput[];
  outputPath: string;
  count?: number;
  options?: {
    model?: string;
  };
}

export interface GeneratedImage {
  path: string;
  size: { width: number; height: number };
}

export interface GenerateImageResult {
  success: boolean;
  images?: GeneratedImage[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class GeminiClient {
  private ai: GoogleGenAI;
  private defaultModel = 'gemini-2.5-flash-image-preview';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateImages(options: GenerateImageOptions): Promise<GenerateImageResult> {
    try {
      // Pre-compute and validate output paths to prevent overwrite
      const intendedPaths: string[] = [];
      const total = options.count || 1;
      for (let i = 0; i < (total < 1 ? 1 : total); i++) {
        const out = this.getOutputPath(options.outputPath, i, total || 1);
        intendedPaths.push(out);
      }
      // Check if any intended output already exists
      for (const p of intendedPaths) {
        try {
          await fs.access(p);
          return {
            success: false,
            error: {
              code: 'FILE_EXISTS',
              message: `Output file already exists: ${p}`
            }
          };
        } catch {
          // not exists, OK
        }
      }

      const count = options.count || 1;
      if (count < 1 || count > 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Count must be between 1 and 10'
          }
        };
      }

      const modelName = options.options?.model || this.defaultModel;

      const generatedImages: GeneratedImage[] = [];

      for (let i = 0; i < count; i++) {
        try {
          const contents = await this.prepareContents(options);
          
          const response = await this.ai.models.generateContent({
            model: modelName,
            contents: contents
          });

          
          if (!response.candidates || response.candidates.length === 0) {
            continue;
          }
          
          for (const part of response.candidates[0].content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
              const imageData = part.inlineData.data;
              const outputPath = this.getOutputPath(options.outputPath, i, count);
              
              await this.ensureDirectoryExists(outputPath);
              
              const buffer = Buffer.from(imageData, 'base64');
              // Double-check non-existence right before write (race safety)
              try {
                await fs.access(outputPath);
                return {
                  success: false,
                  error: {
                    code: 'FILE_EXISTS',
                    message: `Output file already exists: ${outputPath}`
                  }
                };
              } catch {}
              await fs.writeFile(outputPath, buffer, { flag: 'wx' });
              
              const metadata = await sharp(outputPath).metadata();
              
              generatedImages.push({
                path: outputPath,
                size: {
                  width: metadata.width || 0,
                  height: metadata.height || 0
                }
              });
            }
          }
        } catch (err: any) {
          if (i === 0) {
            throw err;
          }
          console.error(`Failed to generate image ${i + 1}:`, err.message);
        }
      }

      if (generatedImages.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_IMAGES_GENERATED',
            message: 'No images were generated'
          }
        };
      }

      return {
        success: true,
        images: generatedImages
      };

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private async prepareContents(options: GenerateImageOptions): Promise<any> {
    const parts: any[] = [];
    
    if (options.prompt) {
      parts.push({ text: options.prompt });
    }
    
    if (options.images && options.images.length > 0) {
      for (const image of options.images) {
        const imageData = await this.loadImageData(image);
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data
          }
        });
      }
    }
    
    if (parts.length === 0) {
      throw new Error('Either prompt or images must be provided');
    }
    
    return parts;
  }

  private async loadImageData(image: ImageInput): Promise<{ data: string; mimeType: string }> {
    let data = image.data;
    let mimeType = image.mimeType || 'image/png';
    
    if (!data.startsWith('data:') && !data.includes('base64,')) {
      // File path handling
      try {
        // Check if file exists first
        await fs.access(data);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new Error(`Image file not found: ${data}`);
        } else if (error.code === 'EACCES') {
          throw new Error(`Permission denied accessing image file: ${data}`);
        } else {
          throw new Error(`Cannot access image file: ${data} - ${error.message}`);
        }
      }
      
      // Read the file
      let buffer: Buffer;
      try {
        buffer = await fs.readFile(data);
      } catch (error: any) {
        throw new Error(`Failed to read image file: ${data} - ${error.message}`);
      }
      
      // Validate it's actually an image by checking magic bytes
      const isValidImage = this.validateImageBuffer(buffer);
      if (!isValidImage) {
        throw new Error(`File is not a valid image format: ${data}`);
      }
      
      data = buffer.toString('base64');
      
      const ext = path.extname(image.data).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        mimeType = 'image/jpeg';
      } else if (ext === '.png') {
        mimeType = 'image/png';
      } else if (ext === '.gif') {
        mimeType = 'image/gif';
      } else if (ext === '.webp') {
        mimeType = 'image/webp';
      }
    } else if (data.startsWith('data:')) {
      const matches = data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        data = matches[2];
        
        // Validate base64 data
        try {
          const buffer = Buffer.from(data, 'base64');
          if (buffer.length === 0) {
            throw new Error('Empty base64 image data');
          }
          
          // Check if it's valid base64 by comparing round-trip
          const reEncoded = buffer.toString('base64');
          if (reEncoded.length === 0) {
            throw new Error('Invalid base64 image data');
          }
          
          // Validate image format
          const isValidImage = this.validateImageBuffer(buffer);
          if (!isValidImage) {
            throw new Error('Base64 data is not a valid image format');
          }
        } catch (error: any) {
          if (error.message.includes('valid image')) {
            throw error;
          }
          throw new Error(`Invalid base64 image data: ${error.message}`);
        }
      } else {
        throw new Error('Invalid data URL format. Expected: data:[mimeType];base64,[data]');
      }
    } else {
      // Plain base64 string
      try {
        const buffer = Buffer.from(data, 'base64');
        if (buffer.length === 0) {
          throw new Error('Empty base64 image data');
        }
        
        const isValidImage = this.validateImageBuffer(buffer);
        if (!isValidImage) {
          throw new Error('Base64 data is not a valid image format');
        }
      } catch (error: any) {
        if (error.message.includes('valid image')) {
          throw error;
        }
        throw new Error(`Invalid base64 image data: ${error.message}`);
      }
    }
    
    return { data, mimeType };
  }

  private getOutputPath(basePath: string, index: number, total: number): string {
    if (total === 1) {
      return basePath;
    }
    
    const dir = path.dirname(basePath);
    const ext = path.extname(basePath);
    const name = path.basename(basePath, ext);
    
    return path.join(dir, `${name}-${index + 1}${ext}`);
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private validateImageBuffer(buffer: Buffer): boolean {
    if (buffer.length < 4) {
      return false;
    }
    
    // Check magic bytes for common image formats
    const magicBytes = buffer.subarray(0, 4);
    
    // PNG: 89 50 4E 47
    if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && 
        magicBytes[2] === 0x4E && magicBytes[3] === 0x47) {
      return true;
    }
    
    // JPEG: FF D8 FF
    if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && 
        magicBytes[2] === 0xFF) {
      return true;
    }
    
    // GIF: 47 49 46 38 (GIF8)
    if (magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && 
        magicBytes[2] === 0x46 && magicBytes[3] === 0x38) {
      return true;
    }
    
    // WebP: 52 49 46 46 (RIFF) - need to check further bytes
    if (magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && 
        magicBytes[2] === 0x46 && magicBytes[3] === 0x46) {
      if (buffer.length >= 12) {
        const webpMarker = buffer.subarray(8, 12);
        // WEBP
        if (webpMarker[0] === 0x57 && webpMarker[1] === 0x45 && 
            webpMarker[2] === 0x42 && webpMarker[3] === 0x50) {
          return true;
        }
      }
    }
    
    // BMP: 42 4D (BM)
    if (magicBytes[0] === 0x42 && magicBytes[1] === 0x4D) {
      return true;
    }
    
    return false;
  }

  private handleError(error: any): GenerateImageResult {
    let code = 'API_ERROR';
    let message = error.message || 'Unknown error occurred';
    
    if (error.message?.includes('API key')) {
      code = 'INVALID_API_KEY';
      message = 'Invalid or missing API key';
    } else if (error.message?.includes('exists')) {
      code = 'FILE_EXISTS';
      message = error.message;
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      code = 'QUOTA_EXCEEDED';
      message = 'API quota exceeded or rate limit reached';
    } else if (error.message?.includes('Permission denied')) {
      code = 'FILE_ACCESS_ERROR';
      message = error.message;
    } else if (error.message?.includes('file not found')) {
      code = 'FILE_NOT_FOUND';
      message = error.message;
    } else if (error.message?.includes('not a valid image')) {
      code = 'INVALID_IMAGE_FORMAT';
      message = error.message;
    } else if (error.message?.includes('Invalid base64')) {
      code = 'INVALID_BASE64';
      message = error.message;
    } else if (error.message?.includes('Empty base64')) {
      code = 'EMPTY_IMAGE_DATA';
      message = error.message;
    } else if (error.message?.includes('permission') || error.message?.includes('access')) {
      code = 'FILE_WRITE_ERROR';
      message = 'Unable to write file to specified path';
    }
    
    return {
      success: false,
      error: {
        code,
        message,
        details: error.stack
      }
    };
  }
}
