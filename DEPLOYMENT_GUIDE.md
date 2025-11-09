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
Run the automation script:
```bash
cd /home/alikheiri/IEEE-origin
./auto-deploy.sh
```

## 🔧 Manual Deployment Steps

### 1. Build Locally
```bash
cd /home/alikheiri/IEEE-origin
npm run build
```

### 2. Create Deployment Package (without secrets)
```bash
zip -r deployment-package.zip .next package.json next.config.mjs public config \
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
- Do NOT include `.env.local` in deployment packages.
- Create and manage env vars on the server at `/opt/ieee-website/.env.local`.
  - See `.env.example` for required keys.

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
- Deploy (`.github/workflows/deploy.yml`): builds and deploys via SSH (manual trigger)

### Required Secrets (Repository Settings → Secrets and variables → Actions)
- `SSH_HOST` — e.g., `91.107.178.13`
- `SSH_USER` — e.g., `root`
- `SSH_KEY` — private key (PEM) with access to the server
- `DEPLOY_PATH` — e.g., `/opt/ieee-website`
- Optional: `PM2_APP_NAME` (default: `IEEE-website`)

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
