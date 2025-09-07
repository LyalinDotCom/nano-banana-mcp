# Nano Banana CLI

A powerful command-line tool for managing Nano Banana MCP server configuration with various AI clients. Features safe configuration management with automatic backups and rollback capabilities.

## Features

- 🚀 **Interactive Setup Wizard** - Guided configuration with validation
- 🔒 **Safe Configuration Management** - Automatic backups before changes
- 🔍 **Auto-Detection** - Finds existing installations automatically
- ✅ **Validation** - Tests API keys and server functionality
- 🎯 **Non-Destructive** - Preserves other MCP server configurations
- 📊 **Status Monitoring** - Check installation health

## Installation

### From Source

```bash
cd cli
npm install
npm run build
npm link
```

### Global Installation (Coming Soon)

```bash
npm install -g nano-banana-cli
```

## Usage

### Setup Wizard (Interactive)

The easiest way to configure Nano Banana:

```bash
nano-banana setup
```

This will:
1. Check prerequisites (Node.js 18+, Gemini CLI)
2. Auto-detect Nano Banana installation
3. Prompt for API key
4. Validate configuration
5. Test the server
6. Save configuration with backup

### Non-Interactive Setup

For CI/CD or scripted installations:

```bash
nano-banana setup \
  --api-key="your-gemini-api-key" \
  --server-path="/path/to/nano-banana-mcp/dist/index.js" \
  --trust \
  --timeout=60000
```

### Check Status

Verify your installation:

```bash
# Basic status
nano-banana status

# Detailed diagnostics
nano-banana doctor

# JSON output for scripting
nano-banana status --json
```

### Remove Configuration

Safely remove Nano Banana (preserves other MCP servers):

```bash
# Interactive removal with prompts
nano-banana remove

# Force removal without prompts
nano-banana remove --force

# Remove but keep backups
nano-banana remove --keep-backups
```

## Commands

### `setup`

Configure Nano Banana for Gemini CLI.

**Options:**
- `-k, --api-key <key>` - Gemini API key
- `-p, --server-path <path>` - Path to server file
- `-t, --trust` - Trust this server (skip confirmations)
- `--no-trust` - Do not trust this server
- `--timeout <ms>` - Request timeout (default: 60000)
- `-f, --force` - Force setup even if tests fail
- `--no-interactive` - Run without prompts

**Examples:**

```bash
# Interactive setup
nano-banana setup

# Quick setup with API key
nano-banana setup --api-key="AIzaSy..."

# Full non-interactive setup
nano-banana setup \
  --api-key="AIzaSy..." \
  --server-path="./dist/index.js" \
  --trust \
  --no-interactive
```

### `status`

Check installation and configuration status.

**Options:**
- `-j, --json` - Output as JSON
- `-v, --verbose` - Show detailed information

**Examples:**

```bash
# Quick status check
nano-banana status

# Detailed status with API validation
nano-banana status --verbose

# Get status as JSON for scripts
nano-banana status --json | jq '.configured'
```

### `doctor`

Diagnose installation issues (alias for `status --verbose`).

```bash
nano-banana doctor
```

### `remove`

Remove Nano Banana configuration.

**Options:**
- `-f, --force` - Skip confirmation prompts
- `--keep-backups` - Preserve backup files

**Examples:**

```bash
# Interactive removal
nano-banana remove

# Quick removal
nano-banana remove --force

# Remove but keep backups for recovery
nano-banana remove --keep-backups
```

## Configuration Management

### Backup System

The CLI automatically creates backups before any configuration changes:

- **Location**: `~/.nano-banana/backups/`
- **Format**: `settings-YYYY-MM-DD_HH-mm-ss.json`
- **Automatic**: Created before setup, update, or removal
- **Retention**: Keeps last 10 backups by default

### Configuration File

The CLI manages the Gemini CLI configuration at:
- **macOS/Linux**: `~/.gemini/settings.json`
- **Windows**: `%USERPROFILE%\.gemini\settings.json`

### Safety Features

1. **Non-Destructive Edits**: Only modifies the `nano-banana` entry
2. **Backup Before Changes**: Automatic backup creation
3. **Validation**: Tests configuration before saving
4. **Rollback**: Can restore from backups if needed

## Troubleshooting

### Common Issues

#### "Gemini CLI not found"

Install the Gemini CLI first:
```bash
npm install -g @google-gemini/cli
```

#### "API key validation failed"

1. Check your API key is correct
2. Ensure it has image generation permissions
3. Try with `--force` to skip validation

#### "Server test failed"

1. Verify the server path is correct
2. Check Node.js version is 18+
3. Ensure all dependencies are installed
4. Try with `--force` to skip testing

### Debug Mode

Set environment variables for debugging:

```bash
# Enable debug output
DEBUG=* nano-banana setup

# Verbose logging
NANO_BANANA_VERBOSE=1 nano-banana status
```

## Advanced Usage

### Custom Configuration Path

Use a different Gemini config file:

```bash
GEMINI_CONFIG_PATH=/custom/path/settings.json nano-banana setup
```

### Restore from Backup

Manually restore a previous configuration:

```bash
# List available backups
ls ~/.nano-banana/backups/

# Restore specific backup
cp ~/.nano-banana/backups/settings-2024-01-01_12-00-00.json ~/.gemini/settings.json
```

### Scripted Installation

Example script for automated setup:

```bash
#!/bin/bash

# Install dependencies
npm install -g @google-gemini/cli
npm install -g nano-banana-cli

# Configure
nano-banana setup \
  --api-key="${GEMINI_API_KEY}" \
  --server-path="/opt/nano-banana-mcp/dist/index.js" \
  --trust \
  --force \
  --no-interactive

# Verify
if nano-banana status --json | jq -e '.configured'; then
  echo "✅ Setup successful"
else
  echo "❌ Setup failed"
  exit 1
fi
```

## Integration Examples

### GitHub Actions

```yaml
- name: Setup Nano Banana
  run: |
    npm install -g nano-banana-cli
    nano-banana setup \
      --api-key="${{ secrets.GEMINI_API_KEY }}" \
      --server-path="./dist/index.js" \
      --no-interactive
```

### Docker

```dockerfile
FROM node:18
RUN npm install -g @google-gemini/cli nano-banana-cli
COPY dist /app/dist
RUN nano-banana setup \
  --api-key="$GEMINI_API_KEY" \
  --server-path="/app/dist/index.js" \
  --no-interactive
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT