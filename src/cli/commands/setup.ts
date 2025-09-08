import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import boxen from 'boxen';
import { ConfigManager } from '../lib/config-manager.js';
import { 
  findNanoBananaInstallation, 
  validateApiKey, 
  checkNodeVersion,
  checkGeminiCLI,
  testServer,
  getDisplayPath
} from '../lib/utils.js';

export interface SetupOptions {
  apiKey?: string;
  serverPath?: string;
  trust?: boolean;
  timeout?: number;
  force?: boolean;
  interactive?: boolean;
}

export async function setupCommand(options: SetupOptions): Promise<void> {
  console.log(chalk.cyan.bold('\n🍌 Nano Banana MCP Setup Wizard\n'));

  // Check prerequisites
  const nodeCheck = checkNodeVersion();
  if (!nodeCheck.valid) {
    console.error(chalk.red(`✗ Node.js 18+ is required (found: ${nodeCheck.version})`));
    process.exit(1);
  }
  console.log(chalk.green(`✓ Node.js ${nodeCheck.version}`));

  const geminiCheck = checkGeminiCLI();
  if (!geminiCheck.installed) {
    console.log(chalk.yellow('⚠ Gemini CLI is not installed'));
    console.log(chalk.gray('  Install with: npm install -g @google-gemini/cli'));
    
    if (!options.force) {
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Continue without Gemini CLI?',
        default: false
      }]);
      
      if (!proceed) {
        process.exit(0);
      }
    }
  } else {
    console.log(chalk.green('✓ Gemini CLI is installed'));
  }

  const configManager = new ConfigManager();
  
  // Check if already configured
  if (await configManager.isConfigured()) {
    if (!options.force) {
      console.log(chalk.yellow('\n⚠ Nano Banana is already configured'));
      
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Update existing configuration', value: 'update' },
          { name: 'Remove and reconfigure', value: 'reconfigure' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }]);

      if (action === 'cancel') {
        process.exit(0);
      } else if (action === 'reconfigure') {
        await configManager.removeNanoBanana();
        console.log(chalk.green('✓ Existing configuration removed'));
      } else {
        // Update mode - load existing config
        const existing = await configManager.getNanoBananaConfig();
        if (existing?.args?.[0]) {
          options.serverPath = existing.args[0];
        }
      }
    }
  }

  // Interactive mode
  if (options.interactive !== false) {
    await interactiveSetup(options, configManager);
  } else {
    await nonInteractiveSetup(options, configManager);
  }
}

async function interactiveSetup(options: SetupOptions, configManager: ConfigManager): Promise<void> {
  const answers: any = {};

  // Find server path
  if (!options.serverPath) {
    const autoDetected = await findNanoBananaInstallation();
    
    if (autoDetected) {
      console.log(chalk.green(`✓ Found Nano Banana at: ${getDisplayPath(autoDetected)}`));
      
      const { useDetected } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useDetected',
        message: 'Use this installation?',
        default: true
      }]);

      if (useDetected) {
        answers.serverPath = autoDetected;
      }
    }

    if (!answers.serverPath) {
      const { serverPath } = await inquirer.prompt([{
        type: 'input',
        name: 'serverPath',
        message: 'Enter the path to nano-banana-mcp/dist/index.js:',
        validate: async (input) => {
          if (!input) return 'Path is required';
          const fullPath = path.resolve(input);
          if (!await fs.pathExists(fullPath)) {
            return 'File does not exist';
          }
          return true;
        }
      }]);
      answers.serverPath = path.resolve(serverPath);
    }
  } else {
    answers.serverPath = path.resolve(options.serverPath);
  }

  // Get API key
  if (!options.apiKey) {
    console.log(chalk.cyan('\n📝 API Key Setup'));
    console.log(chalk.gray('Get your key at: https://aistudio.google.com/apikey\n'));

    const { apiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Gemini API key:',
      mask: '*',
      validate: (input) => {
        if (!input) return 'API key is required';
        if (!input.startsWith('AIza')) return 'Invalid API key format';
        return true;
      }
    }]);
    answers.apiKey = apiKey;
  } else {
    answers.apiKey = options.apiKey;
  }

  // Validate API key
  const isValid = await validateApiKey(answers.apiKey);
  if (!isValid && !options.force) {
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Continue with this API key anyway?',
      default: false
    }]);
    
    if (!proceed) {
      process.exit(1);
    }
  }

  // Advanced options
  const { configureAdvanced } = await inquirer.prompt([{
    type: 'confirm',
    name: 'configureAdvanced',
    message: 'Configure advanced options?',
    default: false
  }]);

  if (configureAdvanced) {
    const advanced = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'trust',
        message: 'Trust this server? (skip confirmation prompts)',
        default: options.trust || false
      },
      {
        type: 'number',
        name: 'timeout',
        message: 'Request timeout (milliseconds):',
        default: options.timeout || 60000,
        validate: (input) => {
          if (isNaN(input) || input < 0) return 'Must be a positive number';
          return true;
        }
      }
    ]);
    
    answers.trust = advanced.trust;
    answers.timeout = advanced.timeout;
  } else {
    answers.trust = options.trust !== undefined ? options.trust : true;
    answers.timeout = options.timeout || 60000;
  }

  // Test the server
  console.log(chalk.cyan('\n🧪 Testing Configuration\n'));
  const serverWorks = await testServer(answers.serverPath, answers.apiKey);
  
  if (!serverWorks && !options.force) {
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Server test failed. Continue anyway?',
      default: false
    }]);
    
    if (!proceed) {
      process.exit(1);
    }
  }

  // Save configuration
  console.log(chalk.cyan('\n💾 Saving Configuration\n'));
  
  await configManager.addNanoBanana({
    serverPath: answers.serverPath,
    apiKey: answers.apiKey,
    trust: answers.trust,
    timeout: answers.timeout
  });

  // Success message
  console.log(
    boxen(
      chalk.green.bold('✨ Setup Complete!\n\n') +
      chalk.white('Nano Banana MCP has been configured for Gemini CLI.\n\n') +
      chalk.cyan('Try it out:\n') +
      chalk.gray('  gemini chat\n') +
      chalk.gray('  > Generate a robot holding a banana at ./robot.png\n\n') +
      chalk.cyan('Configuration saved to:\n') +
      chalk.gray(`  ${getDisplayPath(configManager.getConfigPath())}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    )
  );
}

async function nonInteractiveSetup(options: SetupOptions, configManager: ConfigManager): Promise<void> {
  // Validate required options
  if (!options.apiKey) {
    console.error(chalk.red('✗ API key is required (use --api-key)'));
    process.exit(1);
  }

  let serverPath = options.serverPath;
  if (!serverPath) {
    const found = await findNanoBananaInstallation();
    if (!found) {
      console.error(chalk.red('✗ Could not find Nano Banana installation (use --server-path)'));
      process.exit(1);
    }
    serverPath = found;
  } else {
    serverPath = path.resolve(serverPath);
  }

  // Validate paths exist
  if (!await fs.pathExists(serverPath)) {
    console.error(chalk.red(`✗ Server file not found: ${serverPath}`));
    process.exit(1);
  }

  // Validate API key
  const isValid = await validateApiKey(options.apiKey);
  if (!isValid && !options.force) {
    console.error(chalk.red('✗ Invalid API key'));
    process.exit(1);
  }

  // Test server
  const serverWorks = await testServer(serverPath, options.apiKey);
  if (!serverWorks && !options.force) {
    console.error(chalk.red('✗ Server test failed'));
    process.exit(1);
  }

  // Save configuration
  await configManager.addNanoBanana({
    serverPath,
    apiKey: options.apiKey,
    trust: options.trust !== undefined ? options.trust : true,
    timeout: options.timeout || 60000
  });

  console.log(chalk.green('✓ Configuration saved successfully'));
}