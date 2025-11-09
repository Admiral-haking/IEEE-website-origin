#!/bin/bash

# IEEE Website Complete Automation Script
# This script handles building, git operations, and deployment

echo ""
echo "🚀 IEEE Website Complete Automation System"
echo "=========================================="
echo ""

# Configuration
PROJECT_NAME="IEEE Website"
PROJECT_DIR="${PROJECT_DIR:-$PWD}"
SERVER_IP="${SSH_HOST:-}"
SERVER_USER="${SSH_USER:-root}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Step 1: Check Git status
info "Step 1: Checking Git status..."
cd "$PROJECT_DIR"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

if git diff-index --quiet HEAD --; then
    warning "No changes to commit."
else
    info "Changes detected. Committing..."
    git add .
    git commit -m "Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')"
    success "Changes committed"
fi

# Step 2: Push to remote (if configured)
info "Step 2: Pushing to remote repository..."
if git remote -v | grep -q origin; then
    git push origin "$CURRENT_BRANCH"
    success "Pushed to remote repository"
else
    warning "No remote repository configured"
fi

# Step 3: Build the project
info "Step 3: Building project..."
if npm run build; then
    success "Build completed successfully"
else
    error "Build failed!"
    exit 1
fi

# Step 4: Create deployment package
info "Step 4: Creating deployment package (without secrets)..."
rm -f deployment-package.zip
zip -r deployment-package.zip .next package.json package-lock.json next.config.mjs ecosystem.config.js -x "*.git*" "node_modules/*"
success "Deployment package created: deployment-package.zip"

# Step 5: Display deployment instructions
echo ""
success "Automation completed successfully!"
echo ""
info "📋 Next Steps for Deployment:"
echo ""
echo "1. 📤 Upload package to server:"
echo "   DEPLOY_PATH=/opt/ieee-website scp deployment-package.zip ${SERVER_USER}@${SERVER_IP}:/opt/ieee-website/"
echo ""
echo "2. 🚀 Run deployment on server:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} '"
echo "     cd /opt/ieee-website && \\"
echo "     unzip -o deployment-package.zip && \\"
echo "     npm ci --omit=dev && \\"
echo "     pm2 restart IEEE-website || pm2 start npm --name \"IEEE-website\" -- start'"
echo ""
echo "3. ✅ Verify deployment:"
echo "   curl http://${SERVER_IP}:3000"
echo ""
if [ -n "$SERVER_IP" ]; then info "🌐 Your website will be available at: http://${SERVER_IP}"; fi
echo ""
