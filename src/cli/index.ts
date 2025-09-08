#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { setupCommand } from './commands/setup.js';
import { removeCommand } from './commands/remove.js';
import { statusCommand } from './commands/status.js';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load package.json for version
const packageJson = await fs.readJson(path.join(__dirname, '../../package.json'));

const program = new Command();

program
  .name('nano-banana')
  .description('CLI tool for Nano Banana MCP server - Image generation with Gemini Flash 2.5')
  .version(packageJson.version)
  .addHelpText('after', `
${chalk.cyan('Examples:')}
  $ nano-banana setup              ${chalk.gray('# Interactive setup wizard')}
  $ nano-banana serve              ${chalk.gray('# Start the MCP server')}
  $ nano-banana init               ${chalk.gray('# Initialize new project')}
  $ nano-banana status             ${chalk.gray('# Check installation status')}
  $ nano-banana remove             ${chalk.gray('# Remove configuration')}
  
  ${chalk.cyan('Quick start with npx:')}
  $ npx -p @lyalindotcom/nano-banana-mcp nano-banana setup     ${chalk.gray('# One-time setup')}
  $ npx -p @lyalindotcom/nano-banana-mcp nano-banana serve     ${chalk.gray('# Run server directly')}

${chalk.cyan('More Information:')}
  GitHub: ${chalk.blue('https://github.com/yourusername/nano-banana-mcp')}
  NPM:    ${chalk.blue('https://www.npmjs.com/package/@lyalindotcom/nano-banana-mcp')}
`);

// Setup command
program
  .command('setup')
  .description('Set up Nano Banana MCP server for your AI client')
  .option('-k, --api-key <key>', 'Gemini API key')
  .option('-p, --server-path <path>', 'Path to server (auto-detected if installed via npm)')
  .option('-t, --trust', 'Trust this server (skip confirmations)')
  .option('--no-trust', 'Do not trust this server')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '60000')
  .option('-f, --force', 'Force setup even if tests fail')
  .option('--no-interactive', 'Run in non-interactive mode')
  .action(async (options) => {
    try {
      // Auto-detect server path if not provided
      if (!options.serverPath) {
        const serverPath = path.join(__dirname, '../server/index.js');
        if (await fs.pathExists(serverPath)) {
          options.serverPath = serverPath;
        }
      }
      await setupCommand(options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Serve command - start the MCP server directly
program
  .command('serve')
  .description('Start the Nano Banana MCP server')
  .option('-k, --api-key <key>', 'Gemini API key (or use GEMINI_API_KEY env var)')
  .option('--stdio', 'Run in stdio mode (default for MCP)')
  .action(async (options) => {
    try {
      // Load .env file if it exists
      const envPath = path.join(process.cwd(), '.env');
      if (await fs.pathExists(envPath)) {
        dotenv.config({ path: envPath });
      }

      // Check for API key
      const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('Error: Gemini API key is required'));
        console.log(chalk.yellow('Provide it via --api-key flag or GEMINI_API_KEY environment variable'));
        console.log(chalk.cyan('Get your API key at: https://makersuite.google.com/app/apikey'));
        process.exit(1);
      }

      // Set the API key in environment
      process.env.GEMINI_API_KEY = apiKey;

      // Find the server path
      const serverPath = path.join(__dirname, '../server/index.js');
      if (!await fs.pathExists(serverPath)) {
        console.error(chalk.red('Error: Server file not found'));
        console.log(chalk.yellow('Expected at:', serverPath));
        process.exit(1);
      }

      console.log(chalk.green('Starting Nano Banana MCP server...'));
      console.log(chalk.gray(`API Key: ${apiKey.substring(0, 10)}...`));
      
      // Spawn the server process
      const serverProcess = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          GEMINI_API_KEY: apiKey
        }
      });

      serverProcess.on('error', (error) => {
        console.error(chalk.red('Failed to start server:'), error.message);
        process.exit(1);
      });

      serverProcess.on('exit', (code) => {
        if (code !== 0) {
          console.error(chalk.red(`Server exited with code ${code}`));
          process.exit(code || 1);
        }
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nShutting down server...'));
        serverProcess.kill('SIGINT');
        process.exit(0);
      });

    } catch (error: any) {
      console.error(chalk.red('Failed to start server:'), error.message);
      process.exit(1);
    }
  });

// Init command - initialize a new project
program
  .command('init')
  .description('Initialize a new Nano Banana project with .env file')
  .option('-k, --api-key <key>', 'Gemini API key')
  .action(async (options) => {
    try {
      const envPath = path.join(process.cwd(), '.env');
      
      if (await fs.pathExists(envPath)) {
        console.log(chalk.yellow('.env file already exists'));
        return;
      }

      let apiKey = options.apiKey;
      if (!apiKey) {
        console.log(chalk.yellow('Please provide API key with --api-key flag'));
        console.log(chalk.cyan('Get your API key at: https://makersuite.google.com/app/apikey'));
        process.exit(1);
      }

      const envContent = `# Nano Banana MCP Configuration\nGEMINI_API_KEY=${apiKey}\n\n# Optional: Request timeout in milliseconds\n# MCP_REQUEST_TIMEOUT=60000\n`;

      await fs.writeFile(envPath, envContent);
      console.log(chalk.green('✓ Created .env file'));
      console.log(chalk.cyan('You can now run: nano-banana serve'));
    } catch (error: any) {
      console.error(chalk.red('Init failed:'), error.message);
      process.exit(1);
    }
  });

// Remove command
program
  .command('remove')
  .description('Remove Nano Banana configuration from your AI client')
  .option('-f, --force', 'Skip confirmation prompts')
  .option('--keep-backups', 'Keep backup files')
  .action(async (options) => {
    try {
      await removeCommand(options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check Nano Banana installation status')
  .option('-j, --json', 'Output as JSON')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      await statusCommand(options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Doctor command (alias for verbose status)
program
  .command('doctor')
  .description('Diagnose installation issues')
  .action(async () => {
    try {
      await statusCommand({ verbose: true });
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}