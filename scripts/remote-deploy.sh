#!/usr/bin/env bash
set -euo pipefail

# Remote deploy helper
# - Builds + packs locally
# - Uploads artifact to server
# - Unzips + installs deps + restarts PM2

# Usage (env vars):
#   SSH_HOST=91.107.178.13 \
#   SSH_USER=root \
#   DEPLOY_PATH=/opt/ieee-website \
#   PM2_APP_NAME=IEEE-website \
#   SSH_KEY_PATH=~/.ssh/ieee_ci \
#   bash scripts/remote-deploy.sh

SSH_HOST=${SSH_HOST:-}
SSH_USER=${SSH_USER:-root}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/ieee-website}
PM2_APP_NAME=${PM2_APP_NAME:-IEEE-website}
SSH_KEY_PATH=${SSH_KEY_PATH:-}

if [[ -z "${SSH_HOST}" ]]; then
  echo "[remote-deploy] SSH_HOST is required (e.g., 91.107.178.13)" >&2
  exit 1
fi

echo "[remote-deploy] Building and packing locally..."
npm run build >/dev/null
npm run pack >/dev/null

SSH_OPTS=("-o" "StrictHostKeyChecking=accept-new")
if [[ -n "${SSH_KEY_PATH}" ]]; then
  SSH_OPTS+=("-i" "${SSH_KEY_PATH}")
fi

echo "[remote-deploy] Uploading artifact to ${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}"
scp "${SSH_OPTS[@]}" deployment-package.zip "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/"

echo "[remote-deploy] Running remote deploy steps..."
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" bash -s <<EOF
set -euo pipefail
mkdir -p "${DEPLOY_PATH}"
cd "${DEPLOY_PATH}"
if ! command -v unzip >/dev/null 2>&1; then
  (command -v apt-get >/dev/null 2>&1 && apt-get update -y && apt-get install -y unzip) || true
fi
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi
unzip -o deployment-package.zip >/dev/null
npm ci --omit=dev
pm2 restart "${PM2_APP_NAME}" || pm2 start npm --name "${PM2_APP_NAME}" -- start
sleep 3
curl -fsS http://127.0.0.1:3000/api/health || curl -fsS http://127.0.0.1:3000 || (pm2 logs "${PM2_APP_NAME}" --lines 80 && exit 1)
EOF

echo "[remote-deploy] ✅ Deployment completed."

