#!/usr/bin/env bash
set -euo pipefail

# Show PM2 status and recent logs from remote server

SSH_HOST=${SSH_HOST:-}
SSH_USER=${SSH_USER:-root}
SSH_KEY_PATH=${SSH_KEY_PATH:-}
PM2_APP_NAME=${PM2_APP_NAME:-IEEE-website}

if [[ -z "${SSH_HOST}" ]]; then echo "[remote-status] SSH_HOST required" >&2; exit 1; fi

SSH_OPTS=("-o" "StrictHostKeyChecking=accept-new")
if [[ -n "${SSH_KEY_PATH}" ]]; then SSH_OPTS+=("-i" "${SSH_KEY_PATH}"); fi

ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "pm2 status && pm2 logs '${PM2_APP_NAME}' --lines 60"

