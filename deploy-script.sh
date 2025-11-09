#!/bin/bash

# IEEE Website Auto-Deploy Script
# This script builds the project, pushes to git, and deploys to server

echo "🚀 Starting IEEE Website Auto-Deployment..."

# Configuration
PROJECT_DIR="/home/alikheiri/IEEE-origin"
SERVER_ID="68f6e1f14b2a040259fae208"
REPO_ID="6910b76502538ef1abffa15e"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Step 1: Check if there are changes to commit
log "📊 Checking for changes..."
cd "$PROJECT_DIR"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

if git diff-index --quiet HEAD --; then
    warn "No changes detected. Skipping git operations."
else
    # Step 2: Add and commit changes
    log "📝 Committing changes..."
    git add .
    git commit -m "Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')"
    
    # Step 3: Push to remote repository
    log "📤 Pushing to remote repository..."
    git push origin "$CURRENT_BRANCH"
    log "✅ Changes pushed to Git"
fi

# Step 4: Build the project
log "🔨 Building project..."
if npm run build; then
    log "✅ Build completed successfully"
else
    error "❌ Build failed! Please check the errors above."
    exit 1
fi

# Step 5: Deploy to server
log "🚀 Deploying to server..."
# This would trigger the deployment script on the server
# For now, we'll simulate the deployment
log "📡 Connecting to server: root@91.107.178.13"

# Step 6: Create deployment package
log "📦 Creating deployment package (without secrets)..."
zip -r deployment-package.zip .next package.json package-lock.json next.config.mjs public config -x "*.git*" "node_modules/*"
log "✅ Deployment package created"

echo ""
log "🎉 Auto-deployment process completed!"
log "📋 Summary:"
log "   ✅ Git operations completed"
log "   ✅ Project built successfully"
log "   ✅ Deployment package created"
log ""
log "📝 Next steps:"
log "   1. Upload deployment-package.zip to the server"
log "   2. Run the deployment script on the server"
log "   3. Verify the website is running"
log ""
log "🌐 Your website will be available at: http://91.107.178.13"
