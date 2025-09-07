#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { setupCommand } from './commands/setup.js';
import { removeCommand } from './commands/remove.js';
import { statusCommand } from './commands/status.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load package.json for version
const packageJson = await fs.readJson(path.join(__dirname, '../../package.json'));

const program = new Command();

program
  .name('nano-banana')
  .description('CLI tool for managing Nano Banana MCP server configuration')
  .version(packageJson.version)
  .addHelpText('after', `
${chalk.cyan('Examples:')}
  $ nano-banana setup              ${chalk.gray('# Interactive setup wizard')}
  $ nano-banana setup --api-key=... ${chalk.gray('# Non-interactive setup')}
  $ nano-banana status              ${chalk.gray('# Check installation status')}
  $ nano-banana remove              ${chalk.gray('# Remove configuration')}

${chalk.cyan('More Information:')}
  GitHub: ${chalk.blue('https://github.com/yourusername/nano-banana-mcp')}
  Docs:   ${chalk.blue('https://github.com/yourusername/nano-banana-mcp#readme')}
`);

// Setup command
program
  .command('setup')
  .description('Set up Nano Banana for Gemini CLI')
  .option('-k, --api-key <key>', 'Gemini API key')
  .option('-p, --server-path <path>', 'Path to nano-banana-mcp/dist/index.js')
  .option('-t, --trust', 'Trust this server (skip confirmations)')
  .option('--no-trust', 'Do not trust this server')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '60000')
  .option('-f, --force', 'Force setup even if tests fail')
  .option('--no-interactive', 'Run in non-interactive mode')
  .action(async (options) => {
    try {
      await setupCommand(options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Remove command
program
  .command('remove')
  .description('Remove Nano Banana configuration')
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