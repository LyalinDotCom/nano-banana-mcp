# Publishing Nano Banana MCP to npm

## Pre-Publishing Checklist

- [ ] Update version in package.json
- [ ] Build the project: `npm run build`
- [ ] Test locally: `npm link && nano-banana --version`
- [ ] Update README.md with correct npm package name
- [ ] Ensure .npmignore excludes unnecessary files
- [ ] Check that dist/ folder contains both CLI and server
- [ ] Test all commands work locally

## Publishing Steps

### 1. First-Time Setup
```bash
# Login to npm (one-time)
npm login

# Check you're logged in
npm whoami
```

### 2. Final Build and Test
```bash
# Clean build
npm run clean
npm run build

# Test the package locally
npm link
nano-banana --version
nano-banana --help
nano-banana init --api-key test
```

### 3. Publish to npm

#### Publish as Beta (Recommended First)
```bash
# Publish beta version for testing
npm version prerelease --preid=beta
npm publish --tag beta

# Test the beta package
npx -p @lyalindotcom/nano-banana-mcp@beta nano-banana --version
```

#### Publish as Latest (Production)
```bash
# Update version (patch/minor/major)
npm version patch  # for bug fixes
# or
npm version minor  # for new features
# or 
npm version major  # for breaking changes

# Publish to npm
npm publish

# Verify it works
npx -p @lyalindotcom/nano-banana-mcp nano-banana --version
```

## Post-Publishing

### Test NPX Installation
```bash
# Test without cache
npx --no-cache -p @lyalindotcom/nano-banana-mcp nano-banana --version

# Test init command
npx -p @lyalindotcom/nano-banana-mcp nano-banana init --api-key test

# Test serve command
npx -p @lyalindotcom/nano-banana-mcp nano-banana serve --help
```

### Update GitHub Repository
```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0

# Create GitHub release
# Go to: https://github.com/yourusername/nano-banana-mcp/releases/new
```

### Update Documentation
- Update README.md badges with npm version
- Add npm installation instructions
- Update GitHub repo description with npm package link

## Version Management

### Semantic Versioning
- **Patch** (1.0.X): Bug fixes, minor updates
- **Minor** (1.X.0): New features, backwards compatible
- **Major** (X.0.0): Breaking changes

### Beta Releases
```bash
# Create beta version
npm version prerelease --preid=beta
# Results in: 1.0.1-beta.0

# Increment beta
npm version prerelease
# Results in: 1.0.1-beta.1

# Promote to stable
npm version patch
# Results in: 1.0.1
```

## Troubleshooting

### Issue: 403 Forbidden
```bash
# Check if package name is available
npm view nano-banana-mcp

# If taken, update package.json with new name
```

### Issue: Files missing from package
```bash
# Check what will be published
npm pack --dry-run

# Review .npmignore file
cat .npmignore
```

### Issue: Binary not working
```bash
# Ensure bin paths are correct in package.json
# Ensure files have shebang: #!/usr/bin/env node
# Ensure files are executable
chmod +x dist/cli/index.js
chmod +x dist/server/index.js
```

## NPM Package Configuration

Current package.json settings:
```json
{
  "name": "nano-banana-mcp",
  "version": "1.0.0",
  "bin": {
    "nano-banana": "./dist/cli/index.js",
    "nano-banana-server": "./dist/server/index.js"
  },
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

## Monitoring

### Check Package Stats
- View on npm: https://www.npmjs.com/package/nano-banana-mcp
- Check downloads: https://npm-stat.com/charts.html?package=nano-banana-mcp
- Monitor issues: https://github.com/yourusername/nano-banana-mcp/issues

### Get Feedback
- Watch GitHub stars/issues
- Monitor npm weekly downloads
- Check for security advisories

## Updating the Package

```bash
# Make changes
# ... edit files ...

# Build and test
npm run build
npm link
# ... test commands ...

# Update version and publish
npm version patch
npm publish

# Announce update
echo "🎉 nano-banana-mcp v$(node -p "require('./package.json').version") is now available!"
```
