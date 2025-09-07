import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Find the Nano Banana MCP server installation
 */
export async function findNanoBananaInstallation(): Promise<string | null> {
  // Check common locations
  const possiblePaths = [
    path.resolve('../dist/index.js'), // Relative to CLI
    path.resolve('../../dist/index.js'), // Up one more level
    path.resolve(process.cwd(), 'dist/index.js'), // Current directory
    path.join(process.cwd(), 'nano-banana-mcp/dist/index.js'), // Subdirectory
    '/usr/local/lib/node_modules/nano-banana-mcp/dist/index.js', // Global npm
  ];

  for (const p of possiblePaths) {
    if (await fs.pathExists(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Validate Gemini API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  const spinner = ora('Validating API key...').start();
  
  try {
    // Make a simple API call to validate the key
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: 'Hello'
          }]
        }]
      },
      {
        timeout: 10000,
        validateStatus: (status) => status < 500
      }
    );

    if (response.status === 200) {
      spinner.succeed('API key is valid');
      return true;
    } else if (response.status === 403 || response.status === 401) {
      spinner.fail('API key is invalid or lacks permissions');
      return false;
    } else {
      spinner.warn('Could not validate API key (API returned unexpected status)');
      return true; // Allow proceeding
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      spinner.warn('Could not validate API key (network issue)');
      return true; // Allow proceeding
    }
    spinner.fail(`API key validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Check if Node.js is installed and version is 18+
 */
export function checkNodeVersion(): { valid: boolean; version: string } {
  try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.split('.')[0].substring(1));
    
    return {
      valid: major >= 18,
      version
    };
  } catch {
    return {
      valid: false,
      version: 'not found'
    };
  }
}

/**
 * Check if Gemini CLI is installed
 */
export function checkGeminiCLI(): { installed: boolean; path?: string } {
  try {
    const result = execSync('which gemini', { encoding: 'utf-8' }).trim();
    return {
      installed: true,
      path: result
    };
  } catch {
    try {
      // Try npm global list
      const result = execSync('npm list -g --depth=0 @google-gemini/cli', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      if (result.includes('@google-gemini/cli')) {
        return { installed: true };
      }
    } catch {}
    
    return { installed: false };
  }
}

/**
 * Test if the MCP server runs correctly
 */
export async function testServer(serverPath: string, apiKey: string): Promise<boolean> {
  const spinner = ora('Testing MCP server...').start();
  
  try {
    // Try to run the server briefly
    const { spawn } = await import('child_process');
    const child = spawn('node', [serverPath], {
      env: { ...process.env, GEMINI_API_KEY: apiKey },
      stdio: 'pipe'
    });

    return new Promise((resolve) => {
      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
        
        // Check for expected startup message
        if (errorOutput.includes('Nano Banana MCP server is running')) {
          spinner.succeed('MCP server starts correctly');
          child.kill();
          resolve(true);
        }
      });

      child.on('error', (error: Error) => {
        spinner.fail(`Server test failed: ${error.message}`);
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        child.kill();
        if (errorOutput.includes('GEMINI_API_KEY')) {
          spinner.fail('Server requires GEMINI_API_KEY');
        } else if (output || errorOutput) {
          spinner.succeed('Server appears to be working');
          resolve(true);
        } else {
          spinner.fail('Server did not start properly');
        }
        resolve(false);
      }, 5000);
    });
  } catch (error: any) {
    spinner.fail(`Server test failed: ${error.message}`);
    return false;
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get relative path if under home directory
 */
export function getDisplayPath(filePath: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home && filePath.startsWith(home)) {
    return '~' + filePath.slice(home.length);
  }
  return filePath;
}

/**
 * Create a safe filename from timestamp
 */
export function createTimestampFilename(prefix: string = 'backup'): string {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, -1); // Remove 'Z'
  
  return `${prefix}_${timestamp}.json`;
}

/**
 * Print a formatted JSON object
 */
export function printJson(obj: any, indent: number = 2): void {
  console.log(JSON.stringify(obj, null, indent));
}

/**
 * Check if running in TTY (interactive terminal)
 */
export function isInteractive(): boolean {
  return process.stdin.isTTY && process.stdout.isTTY;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute command and return output
 */
export function exec(command: string): { success: boolean; output?: string; error?: string } {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    return { success: true, output: output.trim() };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout?.toString()
    };
  }
}