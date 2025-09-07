import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { parse, modify, applyEdits, format } from 'jsonc-parser';

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
  trust?: boolean;
}

export interface GeminiConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  [key: string]: any;
}

export class ConfigManager {
  private configPath: string;
  private backupDir: string;

  constructor(configPath?: string) {
    // Default to Gemini CLI config location
    this.configPath = configPath || path.join(os.homedir(), '.gemini', 'settings.json');
    this.backupDir = path.join(os.homedir(), '.nano-banana', 'backups');
  }

  /**
   * Safely read the configuration file
   */
  async readConfig(): Promise<GeminiConfig> {
    try {
      if (!await fs.pathExists(this.configPath)) {
        return {};
      }
      
      const content = await fs.readFile(this.configPath, 'utf-8');
      const errors: any[] = [];
      const config = parse(content, errors, {
        allowTrailingComma: true,
        allowEmptyContent: true
      });
      
      if (errors.length > 0) {
        console.warn('Warning: JSON parsing had issues:', errors);
      }
      
      return config || {};
    } catch (error) {
      console.error('Error reading config:', error);
      return {};
    }
  }

  /**
   * Create a backup of the current configuration
   */
  async createBackup(): Promise<string> {
    if (!await fs.pathExists(this.configPath)) {
      return '';
    }

    await fs.ensureDir(this.backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `settings-${timestamp}.json`);
    
    await fs.copy(this.configPath, backupPath);
    return backupPath;
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    await fs.copy(backupPath, this.configPath, { overwrite: true });
  }

  /**
   * Get the latest backup
   */
  async getLatestBackup(): Promise<string | null> {
    if (!await fs.pathExists(this.backupDir)) {
      return null;
    }

    const files = await fs.readdir(this.backupDir);
    const backups = files
      .filter(f => f.startsWith('settings-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    return backups.length > 0 ? path.join(this.backupDir, backups[0]) : null;
  }

  /**
   * Add or update Nano Banana configuration
   */
  async addNanoBanana(options: {
    serverPath: string;
    apiKey: string;
    trust?: boolean;
    timeout?: number;
  }): Promise<void> {
    // Create backup first
    const backupPath = await this.createBackup();
    if (backupPath) {
      console.log(`✓ Backup created: ${backupPath}`);
    }

    const config = await this.readConfig();

    // Ensure mcpServers exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Add nano-banana configuration
    config.mcpServers['nano-banana'] = {
      command: 'node',
      args: [options.serverPath],
      env: {
        GEMINI_API_KEY: options.apiKey
      },
      ...(options.timeout && { timeout: options.timeout }),
      ...(options.trust !== undefined && { trust: options.trust })
    };

    // Write back to file with proper formatting
    await this.writeConfig(config);
  }

  /**
   * Remove Nano Banana configuration
   */
  async removeNanoBanana(): Promise<boolean> {
    const config = await this.readConfig();
    
    if (!config.mcpServers || !config.mcpServers['nano-banana']) {
      return false;
    }

    // Create backup first
    const backupPath = await this.createBackup();
    if (backupPath) {
      console.log(`✓ Backup created: ${backupPath}`);
    }

    // Remove nano-banana entry
    delete config.mcpServers['nano-banana'];

    // If mcpServers is now empty, remove it
    if (Object.keys(config.mcpServers).length === 0) {
      delete config.mcpServers;
    }

    await this.writeConfig(config);
    return true;
  }

  /**
   * Check if Nano Banana is configured
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.readConfig();
    return !!(config.mcpServers && config.mcpServers['nano-banana']);
  }

  /**
   * Get Nano Banana configuration
   */
  async getNanoBananaConfig(): Promise<MCPServerConfig | null> {
    const config = await this.readConfig();
    return config.mcpServers?.['nano-banana'] || null;
  }

  /**
   * Update existing Nano Banana configuration
   */
  async updateNanoBanana(updates: Partial<MCPServerConfig>): Promise<void> {
    const config = await this.readConfig();
    
    if (!config.mcpServers?.['nano-banana']) {
      throw new Error('Nano Banana is not configured');
    }

    // Create backup first
    const backupPath = await this.createBackup();
    if (backupPath) {
      console.log(`✓ Backup created: ${backupPath}`);
    }

    // Merge updates
    config.mcpServers['nano-banana'] = {
      ...config.mcpServers['nano-banana'],
      ...updates
    };

    await this.writeConfig(config);
  }

  /**
   * Write configuration to file
   */
  private async writeConfig(config: GeminiConfig): Promise<void> {
    // Ensure directory exists
    await fs.ensureDir(path.dirname(this.configPath));

    // Format JSON with proper indentation
    const content = JSON.stringify(config, null, 2);
    
    await fs.writeFile(this.configPath, content, 'utf-8');
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<string[]> {
    if (!await fs.pathExists(this.backupDir)) {
      return [];
    }

    const files = await fs.readdir(this.backupDir);
    return files
      .filter(f => f.startsWith('settings-') && f.endsWith('.json'))
      .map(f => path.join(this.backupDir, f))
      .sort()
      .reverse();
  }

  /**
   * Clean old backups (keep last N)
   */
  async cleanBackups(keepCount: number = 10): Promise<number> {
    const backups = await this.listBackups();
    
    if (backups.length <= keepCount) {
      return 0;
    }

    const toDelete = backups.slice(keepCount);
    for (const backup of toDelete) {
      await fs.remove(backup);
    }

    return toDelete.length;
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Check if config file exists
   */
  async configExists(): Promise<boolean> {
    return fs.pathExists(this.configPath);
  }
}