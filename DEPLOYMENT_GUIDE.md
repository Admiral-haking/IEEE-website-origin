# IEEE Website Deployment Guide

## 📋 Overview
This document describes the complete deployment and automation system for the IEEE Website project.

## 🎯 Project Structure
- **Local Path**: `/home/alikheiri/IEEE-origin`
- **Server Path**: `/opt/ieee-website`
- **Server**: `root@91.107.178.13` (admiral-server2)

## 🚀 Quick Start

### Initial Server Setup
1. Connect to the server:
   ```bash
   ssh root@91.107.178.13
   ```

2. Run initial setup:
   ```bash
   cd /opt/ieee-website
   # Run the setup script from Pro Project Manager
   ```

### Automated Deployment
Run the unified deploy CLI:
```bash
cd /home/alikheiri/IEEE-origin
bash ./deploy.sh ship
```

## 🔧 Manual Deployment Steps

### 1. Build Locally
```bash
cd /home/alikheiri/IEEE-origin
npm run build
```

### 2. Create Deployment Package (without secrets)
```bash
zip -r deployment-package.zip .next package.json package-lock.json next.config.mjs public config \
  -x "*.git*" "node_modules/*"
```

### 3. Upload to Server
```bash
scp deployment-package.zip root@91.107.178.13:/opt/ieee-website/
```

### 4. Deploy on Server
```bash
ssh root@91.107.178.13 <<'SSH'
set -e
cd /opt/ieee-website
unzip -o deployment-package.zip
npm ci --omit=dev
pm2 restart IEEE-website || pm2 start npm --name "IEEE-website" -- start
SSH
```

## ⚙️ Configuration Files

### Environment Variables
- Do NOT include local env files in deployment packages.
- Create and manage env vars on the server at `/opt/ieee-website/.env.local` (or `.env` if you prefer a single file).
  - See `.env` in the repo for the full list of required keys and defaults.

### Nginx Configuration
The server includes Nginx configuration for reverse proxy.

### PM2 Configuration
PM2 manages the Node.js process with auto-restart and logging.

## 🔄 Automation Features

### Git Integration
- Automatic commit of changes
- Push to remote repository
- Build verification

### Build System
- Next.js production build
- Dependency installation
- Asset optimization

### Deployment
- Zero-downtime with PM2
- Health checks
- Rollback: keep previous `deployment-package.zip` and PM2 logs for restore

## 🤖 GitHub Actions (CI/CD)

Two workflows are provided:

- CI (`.github/workflows/ci.yml`): install, lint, build on pushes/PRs
- Deploy (`.github/workflows/deploy.yml`): auto-deploys on push to `main` (with approval if environment requires it)

### Required GitHub Secrets (Settings → Secrets and variables → Actions)
- `SSH_HOST` — e.g., `91.107.178.13`
- `SSH_USER` — e.g., `root`
- One of the following authentication methods:
  - `SSH_KEY` — private key (PEM, full contents) for server access
  - or `SSH_PASS` — SSH password for the user (less secure)
- `DEPLOY_PATH` — e.g., `/opt/ieee-website`
- Optional:
  - `PM2_APP_NAME` — defaults to `IEEE-website`
  - `SSH_PASSPHRASE` — if your SSH key is passphrase-protected
  - `SSH_FINGERPRINT` — server host key fingerprint for strict verification

### Environment protection & approval
- In GitHub → Settings → Environments → `production`:
  - Create environment `production`.
  - Require reviewers (e.g., you) to approve before deployment.
  - Optional: add wait timer or branch restrictions.

With this setup, only one command is needed to release:

1) Locally: `git push origin main`
2) GitHub Actions runs CI and build automatically.
3) You approve the `production` environment when checks pass (click Approve).
4) Workflow deploys to the server and runs a health check.

### Local CLI (deploy.sh) Examples
```bash
# Build + pack + upload + remote deploy
bash ./deploy.sh ship

# Only upload existing deployment-package.zip and run remote steps
bash ./deploy.sh deploy

# Push local .env.local to the server and restart PM2
bash ./deploy.sh env:push

# Show PM2 status and recent logs
bash ./deploy.sh status
```

### Security Notes
- Do not commit `.deploy.env` or any credentials to git. `.gitignore` already excludes it.
- If any secret was accidentally exposed, rotate it on the server and update GitHub Secrets immediately.

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 status
pm2 logs IEEE-website
```

### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
tail -f /root/.pm2/logs/IEEE-website-out.log
tail -f /root/.pm2/logs/IEEE-website-error.log
```

## 🛠️ Troubleshooting

### Common Issues
1. **Build Fails**: Check for TypeScript/import errors
2. **Server Not Responding**: Verify PM2 status and Nginx configuration
3. **Environment Variables**: Ensure all required variables are set

### Health Checks
```bash
# Check if application is running
curl http://localhost:3000

# Check PM2 status
pm2 status

# Check Nginx
systemctl status nginx
```

## 📞 Support
For deployment issues, check:
1. Server logs
2. Build errors
3. Network connectivity
4. Environment configuration

---
**Last Updated**: 2025-11-09
