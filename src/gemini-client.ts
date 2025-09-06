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
  data: string;
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
              await fs.writeFile(outputPath, buffer);
              
              const metadata = await sharp(outputPath).metadata();
              
              generatedImages.push({
                path: outputPath,
                data: imageData,
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
      const buffer = await fs.readFile(data);
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

  private handleError(error: any): GenerateImageResult {
    let code = 'API_ERROR';
    let message = error.message || 'Unknown error occurred';
    
    if (error.message?.includes('API key')) {
      code = 'INVALID_API_KEY';
      message = 'Invalid or missing API key';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      code = 'QUOTA_EXCEEDED';
      message = 'API quota exceeded or rate limit reached';
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