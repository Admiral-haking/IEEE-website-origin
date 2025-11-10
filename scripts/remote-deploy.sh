#!/usr/bin/env bash
set -euo pipefail

# Remote deploy helper
# - Builds + packs locally (unless SKIP_BUILD=1)
# - Uploads artifact to server (supports SSH key or password)
# - Unzips + installs deps + restarts PM2

# Usage (env vars):
#   SSH_HOST=91.107.178.13 \
#   SSH_USER=root \
#   DEPLOY_PATH=/opt/ieee-website \
#   PM2_APP_NAME=IEEE-website \
#   SSH_KEY_PATH=~/.ssh/ieee_ci \
#   SSH_PASS=your_password \
#   SKIP_BUILD=1 \  # optional, when already built+packed
#   bash scripts/remote-deploy.sh

# Optionally load .deploy.env if present (ignored by git)
if [[ -f .deploy.env ]]; then
  # shellcheck disable=SC1091
  . ./.deploy.env
  echo "[remote-deploy] Loaded config from .deploy.env"
fi

SSH_HOST=${SSH_HOST:-}
SSH_USER=${SSH_USER:-root}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/ieee-website}
PM2_APP_NAME=${PM2_APP_NAME:-IEEE-website}
SSH_KEY_PATH=${SSH_KEY_PATH:-}
SSH_PASS=${SSH_PASS:-}
SKIP_BUILD=${SKIP_BUILD:-}

if [[ -z "${SSH_HOST}" ]]; then
  echo "[remote-deploy] SSH_HOST is required (e.g., 91.107.178.13)" >&2
  exit 1
fi

if [[ -z "${SKIP_BUILD}" ]]; then
  echo "[remote-deploy] Building and packing locally..."
  npm run build >/dev/null
  npm run pack >/dev/null
else
  echo "[remote-deploy] SKIP_BUILD=1 set — using existing deployment-package.zip"
fi

SSH_OPTS=("-o" "StrictHostKeyChecking=accept-new")
if [[ -n "${SSH_KEY_PATH}" ]]; then
  SSH_OPTS+=("-i" "${SSH_KEY_PATH}")
fi

# If password is provided, prefer sshpass for non-interactive auth
SSHPASS_PREFIX=()
if [[ -n "${SSH_PASS}" ]]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    echo "[remote-deploy] sshpass not found. Attempting to install (apt-get/brew)..."
    if command -v apt-get >/dev/null 2>&1; then
      (sudo apt-get update -y && sudo apt-get install -y sshpass) || true
    elif command -v brew >/dev/null 2>&1; then
      brew install hudochenkov/sshpass/sshpass || true
    fi
  fi
  if command -v sshpass >/dev/null 2>&1; then
    SSHPASS_PREFIX=(sshpass -p "${SSH_PASS}")
  else
    echo "[remote-deploy] Warning: sshpass not available. Falling back to SSH key auth or interactive password prompt." >&2
  fi
fi

echo "[remote-deploy] Ensuring remote path exists: ${DEPLOY_PATH}"
if (( ${#SSHPASS_PREFIX[@]} )); then
  "${SSHPASS_PREFIX[@]}" ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "mkdir -p '${DEPLOY_PATH}'"
else
  ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "mkdir -p '${DEPLOY_PATH}'"
fi

echo "[remote-deploy] Uploading artifact to ${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}"
if (( ${#SSHPASS_PREFIX[@]} )); then
  "${SSHPASS_PREFIX[@]}" scp "${SSH_OPTS[@]}" deployment-package.zip "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/"
else
  scp "${SSH_OPTS[@]}" deployment-package.zip "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/"
fi

echo "[remote-deploy] Running remote deploy steps..."
if (( ${#SSHPASS_PREFIX[@]} )); then
  "${SSHPASS_PREFIX[@]}" ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" bash -s <<EOF
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
else
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
fi

echo "[remote-deploy] ✅ Deployment completed."
