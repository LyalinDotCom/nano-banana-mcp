import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import fs from 'fs-extra';
import path from 'path';
import { ConfigManager } from '../lib/config-manager.js';
import { 
  checkNodeVersion, 
  checkGeminiCLI, 
  testServer,
  getDisplayPath,
  formatFileSize,
  validateApiKey
} from '../lib/utils.js';

export interface StatusOptions {
  json?: boolean;
  verbose?: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  if (!options.json) {
    console.log(chalk.cyan.bold('\n🔍 Nano Banana Status Check\n'));
  }

  const status: any = {
    configured: false,
    node: { installed: false, version: '', valid: false },
    geminiCli: { installed: false },
    server: { found: false, path: '', working: false },
    apiKey: { configured: false, valid: false },
    config: {}
  };

  // Check Node.js
  const nodeCheck = checkNodeVersion();
  status.node = {
    installed: nodeCheck.valid || nodeCheck.version !== 'not found',
    version: nodeCheck.version,
    valid: nodeCheck.valid
  };

  if (!options.json) {
    if (status.node.valid) {
      console.log(chalk.green(`✓ Node.js ${status.node.version}`));
    } else {
      console.log(chalk.red(`✗ Node.js ${status.node.version} (18+ required)`));
    }
  }

  // Check Gemini CLI
  const geminiCheck = checkGeminiCLI();
  status.geminiCli = geminiCheck;

  if (!options.json) {
    if (status.geminiCli.installed) {
      console.log(chalk.green('✓ Gemini CLI is installed'));
      if (geminiCheck.path && options.verbose) {
        console.log(chalk.gray(`  Path: ${geminiCheck.path}`));
      }
    } else {
      console.log(chalk.yellow('⚠ Gemini CLI is not installed'));
      if (options.verbose) {
        console.log(chalk.gray('  Install with: npm install -g @google-gemini/cli'));
      }
    }
  }

  // Check configuration
  const configManager = new ConfigManager();
  status.configured = await configManager.isConfigured();

  if (status.configured) {
    const config = await configManager.getNanoBananaConfig();
    status.config = config;

    if (!options.json) {
      console.log(chalk.green('✓ Nano Banana is configured'));
      
      if (options.verbose && config) {
        console.log(chalk.gray(`  Config: ${getDisplayPath(configManager.getConfigPath())}`));
      }
    }

    // Check server file
    if (config?.args?.[0]) {
      const serverPath = config.args[0];
      status.server.path = serverPath;
      status.server.found = await fs.pathExists(serverPath);

      if (!options.json) {
        if (status.server.found) {
          console.log(chalk.green(`✓ Server found at ${getDisplayPath(serverPath)}`));
          
          if (options.verbose) {
            const stats = await fs.stat(serverPath);
            console.log(chalk.gray(`  Size: ${formatFileSize(stats.size)}`));
            console.log(chalk.gray(`  Modified: ${stats.mtime.toLocaleDateString()}`));
          }
        } else {
          console.log(chalk.red(`✗ Server not found at ${getDisplayPath(serverPath)}`));
        }
      }

      // Check API key
      if (config.env?.GEMINI_API_KEY) {
        status.apiKey.configured = true;
        
        if (!options.json) {
          const maskedKey = config.env.GEMINI_API_KEY.substring(0, 10) + '...';
          console.log(chalk.green(`✓ API key configured (${maskedKey})`));
        }

        // Validate API key if verbose
        if (options.verbose && !options.json) {
          const spinner = ora('Validating API key...').start();
          status.apiKey.valid = await validateApiKey(config.env.GEMINI_API_KEY);
          
          if (status.apiKey.valid) {
            spinner.succeed('API key is valid');
          } else {
            spinner.fail('API key validation failed');
          }
        }

        // Test server if everything looks good
        if (status.server.found && status.apiKey.configured) {
          if (!options.json && options.verbose) {
            const serverWorks = await testServer(serverPath, config.env.GEMINI_API_KEY);
            status.server.working = serverWorks;
          }
        }
      } else {
        if (!options.json) {
          console.log(chalk.red('✗ API key not configured'));
        }
      }
    }

    // Check for backups
    if (options.verbose && !options.json) {
      const backups = await configManager.listBackups();
      if (backups.length > 0) {
        console.log(chalk.cyan(`\n📦 Backups (${backups.length})`));
        const latestBackup = backups[0];
        const stats = await fs.stat(latestBackup);
        console.log(chalk.gray(`  Latest: ${path.basename(latestBackup)}`));
        console.log(chalk.gray(`  Created: ${stats.mtime.toLocaleDateString()}`));
      }
    }

  } else {
    if (!options.json) {
      console.log(chalk.yellow('⚠ Nano Banana is not configured'));
      console.log(chalk.gray(`  Run 'nano-banana setup' to configure`));
    }
  }

  // Output JSON if requested
  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  // Summary box
  const isReady = status.configured && 
                  status.node.valid && 
                  status.server.found && 
                  status.apiKey.configured;

  const summaryColor = isReady ? 'green' : 'yellow';
  const summaryTitle = isReady ? '✅ Ready to Use!' : '⚠️  Setup Required';
  const summaryMessage = isReady 
    ? 'Nano Banana is fully configured and ready.\n\nTry it with:\n  gemini chat'
    : 'Some configuration is needed.\n\nRun:\n  nano-banana setup';

  console.log(
    boxen(
      chalk[summaryColor].bold(summaryTitle + '\n\n') +
      chalk.white(summaryMessage),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: summaryColor
      }
    )
  );
}