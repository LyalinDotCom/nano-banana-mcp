#!/bin/bash

# Nano Banana Quick Start Script
# This script sets up everything needed for a demo in minutes

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Banner
echo ""
echo -e "${CYAN}${BOLD}🍌 Nano Banana MCP Quick Start${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Check Node.js version
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
if [[ "$NODE_VERSION" == "not installed" ]]; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required (found $NODE_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"

# Check for Gemini CLI
if command -v gemini &> /dev/null; then
    echo -e "${GREEN}✓ Gemini CLI is installed${NC}"
else
    echo -e "${YELLOW}⚠ Gemini CLI not found${NC}"
    echo -e "  Installing Gemini CLI..."
    npm install -g @google-gemini/cli || {
        echo -e "${RED}Failed to install Gemini CLI${NC}"
        echo "  Try manually: npm install -g @google-gemini/cli"
        exit 1
    }
    echo -e "${GREEN}✓ Gemini CLI installed${NC}"
fi

# Build the project
echo ""
echo -e "${BLUE}🔨 Building Nano Banana...${NC}"
npm install --silent 2>/dev/null || npm install
npm run build || {
    echo -e "${RED}Build failed!${NC}"
    exit 1
}
echo -e "${GREEN}✓ Build complete${NC}"

# Check for API key
echo ""
if [ -z "$GEMINI_API_KEY" ]; then
    if [ -f .env ] && grep -q "GEMINI_API_KEY=" .env; then
        echo -e "${GREEN}✓ API key found in .env${NC}"
        source .env
    else
        echo -e "${YELLOW}📝 Gemini API Key Setup${NC}"
        echo -e "${CYAN}Get your key at: https://aistudio.google.com/apikey${NC}"
        echo ""
        read -p "Enter your Gemini API key: " -s API_KEY
        echo ""
        
        if [[ ! "$API_KEY" =~ ^AIza ]]; then
            echo -e "${RED}✗ Invalid API key format${NC}"
            exit 1
        fi
        
        echo "GEMINI_API_KEY=$API_KEY" > .env
        export GEMINI_API_KEY=$API_KEY
        echo -e "${GREEN}✓ API key saved to .env${NC}"
    fi
else
    echo -e "${GREEN}✓ API key found in environment${NC}"
fi

# Run the setup
echo ""
echo -e "${BLUE}🚀 Configuring Gemini CLI...${NC}"

# Use the CLI to set up
cd cli
node dist/index.js setup \
    --api-key="$GEMINI_API_KEY" \
    --server-path="../dist/index.js" \
    --trust \
    --no-interactive \
    --force || {
    echo -e "${YELLOW}Trying interactive setup...${NC}"
    node dist/index.js setup --api-key="$GEMINI_API_KEY" --server-path="../dist/index.js"
}
cd ..

# Verify installation
echo ""
echo -e "${BLUE}🔍 Verifying installation...${NC}"
cd cli && node dist/index.js status --verbose && cd .. || {
    echo -e "${YELLOW}⚠ Status check had warnings${NC}"
}

# Success message
echo ""
echo -e "${GREEN}${BOLD}✨ Setup Complete!${NC}"
echo ""
echo -e "${CYAN}Try it out:${NC}"
echo -e "  ${BOLD}gemini chat${NC}"
echo -e "  ${BOLD}> Generate a robot holding a banana at ./demo.png${NC}"
echo ""
echo -e "${CYAN}CLI Commands:${NC}"
echo -e "  ${BOLD}nano-banana status${NC}  - Check configuration"
echo -e "  ${BOLD}nano-banana doctor${NC}  - Diagnose issues"
echo -e "  ${BOLD}nano-banana remove${NC}  - Remove configuration"
echo ""
echo -e "${BLUE}Happy image generating! 🎨${NC}"
echo ""