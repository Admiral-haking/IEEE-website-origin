#!/bin/bash

# IEEE Website Auto-Deploy Script
# This script builds the project, pushes to git, and deploys to server

echo "🚀 Starting IEEE Website Auto-Deployment..."

# Optional: load deployment secrets/config from .deploy.env (ignored by git)
if [ -f .deploy.env ]; then
  # shellcheck disable=SC1091
  . ./.deploy.env
  echo "ℹ️  Loaded config from .deploy.env"
fi

# Configuration (env-driven)
PROJECT_DIR="${PROJECT_DIR:-$PWD}"
SERVER_ID="${SERVER_ID:-}"
REPO_ID="${REPO_ID:-}"

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

# Step 5: Create deployment package
log "📦 Creating deployment package (without secrets)..."
zip -r deployment-package.zip .next package.json package-lock.json next.config.mjs ecosystem.config.js -x "*.git*" "node_modules/*"
log "✅ Deployment package created"

# Step 6: Deploy to server (hand-off to remote-deploy helper if SSH_HOST is set)
log "🚀 Deploying to server..."
if [ -n "${SSH_HOST:-}" ]; then
  log "Using scripts/remote-deploy.sh with SSH_HOST=${SSH_HOST}"
  # Avoid double build/pack; pass SKIP_BUILD=1 and forward SSH_* vars
  SSH_USER="${SSH_USER:-root}" \
  DEPLOY_PATH="${DEPLOY_PATH:-/opt/ieee-website}" \
  PM2_APP_NAME="${PM2_APP_NAME:-IEEE-website}" \
  SSH_KEY_PATH="${SSH_KEY_PATH:-}" \
  SSH_PASS="${SSH_PASS:-}" \
  SKIP_BUILD=1 \
  bash scripts/remote-deploy.sh || exit $?
fi

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
if [ -n "${SSH_HOST:-}" ]; then log "🌐 Your website will be available at: http://${SSH_HOST}"; fi
