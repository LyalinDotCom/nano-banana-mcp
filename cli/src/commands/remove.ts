import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import { ConfigManager } from '../lib/config-manager.js';
import { getDisplayPath } from '../lib/utils.js';

export interface RemoveOptions {
  force?: boolean;
  keepBackups?: boolean;
}

export async function removeCommand(options: RemoveOptions): Promise<void> {
  console.log(chalk.cyan.bold('\n🗑️  Remove Nano Banana Configuration\n'));

  const configManager = new ConfigManager();

  // Check if configured
  if (!await configManager.isConfigured()) {
    console.log(chalk.yellow('⚠ Nano Banana is not configured'));
    console.log(chalk.gray(`  No configuration found in ${getDisplayPath(configManager.getConfigPath())}`));
    process.exit(0);
  }

  // Show current configuration
  const currentConfig = await configManager.getNanoBananaConfig();
  console.log(chalk.cyan('Current configuration:'));
  console.log(chalk.gray(JSON.stringify(currentConfig, null, 2)));

  // Confirm removal
  if (!options.force) {
    const { confirmRemove } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmRemove',
      message: 'Are you sure you want to remove Nano Banana configuration?',
      default: false
    }]);

    if (!confirmRemove) {
      console.log(chalk.yellow('✗ Removal cancelled'));
      process.exit(0);
    }
  }

  // Remove configuration
  const removed = await configManager.removeNanoBanana();
  
  if (removed) {
    console.log(chalk.green('✓ Configuration removed successfully'));
    
    // Handle backups
    if (!options.keepBackups) {
      const backups = await configManager.listBackups();
      
      if (backups.length > 0) {
        console.log(chalk.cyan(`\nFound ${backups.length} backup(s)`));
        
        if (!options.force) {
          const { cleanBackups } = await inquirer.prompt([{
            type: 'confirm',
            name: 'cleanBackups',
            message: 'Keep backup files for potential restore?',
            default: true
          }]);

          if (!cleanBackups) {
            const cleaned = await configManager.cleanBackups(0);
            console.log(chalk.green(`✓ Removed ${cleaned} backup file(s)`));
          } else {
            console.log(chalk.gray(`  Backups preserved in: ~/.nano-banana/backups/`));
          }
        }
      }
    }

    // Show success message
    console.log(
      boxen(
        chalk.green.bold('✓ Nano Banana Removed\n\n') +
        chalk.white('The configuration has been safely removed.\n') +
        chalk.white('Other MCP servers remain unchanged.\n\n') +
        chalk.cyan('To reinstall, run:\n') +
        chalk.gray('  nano-banana setup'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'yellow'
        }
      )
    );
  } else {
    console.log(chalk.red('✗ Failed to remove configuration'));
    process.exit(1);
  }
}