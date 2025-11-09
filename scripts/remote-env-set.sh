#!/usr/bin/env bash
set -euo pipefail

# Push a local env file to the server and restart PM2.

# Usage examples:
#   SSH_HOST=91.107.178.13 SSH_USER=root DEPLOY_PATH=/opt/ieee-website \
#   SSH_KEY_PATH=~/.ssh/ieee_ci ENV_FILE=.env.local \
#   bash scripts/remote-env-set.sh

SSH_HOST=${SSH_HOST:-}
SSH_USER=${SSH_USER:-root}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/ieee-website}
PM2_APP_NAME=${PM2_APP_NAME:-IEEE-website}
SSH_KEY_PATH=${SSH_KEY_PATH:-}
ENV_FILE=${ENV_FILE:-.env.local}

if [[ -z "${SSH_HOST}" ]]; then
  echo "[remote-env-set] SSH_HOST is required" >&2; exit 1; fi
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[remote-env-set] ENV_FILE not found: ${ENV_FILE}" >&2; exit 1; fi

SSH_OPTS=("-o" "StrictHostKeyChecking=accept-new")
if [[ -n "${SSH_KEY_PATH}" ]]; then SSH_OPTS+=("-i" "${SSH_KEY_PATH}"); fi

echo "[remote-env-set] Uploading ${ENV_FILE} to ${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/.env.local"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "mkdir -p '${DEPLOY_PATH}'"
scp "${SSH_OPTS[@]}" "${ENV_FILE}" "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/.env.local"

echo "[remote-env-set] Restarting PM2 app ${PM2_APP_NAME}"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "pm2 restart '${PM2_APP_NAME}' || pm2 start npm --name '${PM2_APP_NAME}' -- start"

echo "[remote-env-set] ✅ Env updated and app restarted."

