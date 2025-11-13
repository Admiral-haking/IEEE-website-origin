#!/usr/bin/env bash
set -euo pipefail

# Unified deployment CLI for IEEE Website
# Subcommands:
#   git:auto       - commit local changes and push to origin
#   build          - next build (prod)
#   pack           - zip deployment-package.zip (no secrets)
#   upload         - upload deployment-package.zip to server
#   remote         - run remote deploy steps (unzip, npm ci, pm2 restart)
#   deploy         - upload + remote
#   ship           - build + pack + deploy (optionally git:auto)
#   env:push       - upload .env.local (or ENV_FILE) to server and restart
#   status         - show PM2 status and recent logs on server
#
# Config: loads from ./.deploy.env when present. Supports both SSH key and password.

# Load local deploy env if exists (ignored by git)
if [[ -f .deploy.env ]]; then
  # shellcheck disable=SC1091
  . ./.deploy.env
fi

# Colors and logging helpers
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"; }
err()  { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"; }

# Config (env-driven)
PROJECT_DIR="${PROJECT_DIR:-$PWD}"
SSH_HOST=${SSH_HOST:-}
SSH_USER=${SSH_USER:-root}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/ieee-website}
PM2_APP_NAME=${PM2_APP_NAME:-IEEE-website}
SSH_KEY_PATH=${SSH_KEY_PATH:-}
SSH_PASS=${SSH_PASS:-}
ENV_FILE=${ENV_FILE:-.env.local}
SKIP_BUILD=${SKIP_BUILD:-}

# SSH helpers
build_ssh_opts() {
  local -a opts=("-o" "StrictHostKeyChecking=accept-new")
  if [[ -n "$SSH_KEY_PATH" ]]; then
    opts+=("-i" "$SSH_KEY_PATH")
  fi
  printf '%q ' "${opts[@]}"
}

with_sshpass() {
  # If SSH_PASS is set and sshpass is available, prefix the command
  if [[ -n "$SSH_PASS" ]] && command -v sshpass >/dev/null 2>&1; then
    printf 'sshpass -p %q ' "$SSH_PASS"
  else
    printf ''
  fi
}

ensure_sshpass() {
  if [[ -n "$SSH_PASS" ]] && ! command -v sshpass >/dev/null 2>&1; then
    warn "sshpass not found; attempting to install..."
    if command -v apt-get >/dev/null 2>&1; then
      (sudo apt-get update -y && sudo apt-get install -y sshpass) || true
    elif command -v brew >/dev/null 2>&1; then
      brew install hudochenkov/sshpass/sshpass || true
    fi
  fi
}

# Actions
git_auto() {
  cd "$PROJECT_DIR"
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  log "📊 Checking for changes..."
  if git diff-index --quiet HEAD --; then
    warn "No changes detected. Skipping git commit/push."
  else
    log "📝 Committing changes..."
    git add .
    git commit -m "Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')"
    log "📤 Pushing to origin/${branch}..."
    git push origin "$branch"
    log "✅ Changes pushed"
  fi
}

build() {
  cd "$PROJECT_DIR"
  log "🔨 Building project..."
  npm run build
  log "✅ Build completed"
}

pack() {
  cd "$PROJECT_DIR"
  log "📦 Creating deployment package..."
  npm run pack
  log "✅ deployment-package.zip created"
}

require_host() {
  if [[ -z "${SSH_HOST}" ]]; then
    err "SSH_HOST is required (set in .deploy.env or env)"; exit 1
  fi
}

upload() {
  require_host
  ensure_sshpass
  local ssh_opts
  # shellcheck disable=SC2046
  ssh_opts=$(build_ssh_opts)
  log "📤 Ensuring remote path exists: ${DEPLOY_PATH}"
  eval $(with_sshpass) ssh ${ssh_opts} "${SSH_USER}@${SSH_HOST}" "mkdir -p '${DEPLOY_PATH}'"
  log "📤 Uploading deployment-package.zip to ${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/"
  eval $(with_sshpass) scp ${ssh_opts} "deployment-package.zip" "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/"
  log "✅ Upload complete"
}

remote() {
  require_host
  ensure_sshpass
  local ssh_opts
  # shellcheck disable=SC2046
  ssh_opts=$(build_ssh_opts)
  log "🚀 Running remote deployment..."
  eval $(with_sshpass) ssh ${ssh_opts} "${SSH_USER}@${SSH_HOST}" bash -s <<EOF
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
  log "✅ Remote deployment complete"
}

deploy_combo() {
  upload
  remote
}

ship() {
  # Optional: run git_auto if GIT_AUTO=1
  if [[ "${GIT_AUTO:-}" == "1" ]]; then git_auto; fi
  if [[ -z "${SKIP_BUILD}" ]]; then
    build
    pack
  else
    warn "SKIP_BUILD=1 set — skipping build, using existing deployment-package.zip"
  fi
  deploy_combo
}

env_push() {
  require_host
  if [[ ! -f "${ENV_FILE}" ]]; then
    err "ENV_FILE not found: ${ENV_FILE}"; exit 1
  fi
  ensure_sshpass
  local ssh_opts
  # shellcheck disable=SC2046
  ssh_opts=$(build_ssh_opts)
  log "🔧 Uploading ${ENV_FILE} to ${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/.env.local"
  eval $(with_sshpass) ssh ${ssh_opts} "${SSH_USER}@${SSH_HOST}" "mkdir -p '${DEPLOY_PATH}'"
  eval $(with_sshpass) scp ${ssh_opts} "${ENV_FILE}" "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/.env.local"
  log "♻️  Restarting PM2 app ${PM2_APP_NAME}"
  eval $(with_sshpass) ssh ${ssh_opts} "${SSH_USER}@${SSH_HOST}" "pm2 restart '${PM2_APP_NAME}' || pm2 start npm --name '${PM2_APP_NAME}' -- start"
  log "✅ Env updated and app restarted"
}

status() {
  require_host
  ensure_sshpass
  local ssh_opts
  # shellcheck disable=SC2046
  ssh_opts=$(build_ssh_opts)
  log "📊 PM2 status and last logs for ${PM2_APP_NAME}"
  eval $(with_sshpass) ssh ${ssh_opts} "${SSH_USER}@${SSH_HOST}" "pm2 status && pm2 logs '${PM2_APP_NAME}' --lines 60"
}

usage() {
  cat <<USAGE
Usage: bash ./deploy.sh <command>

Commands:
  git:auto       Commit and push local changes
  build          Build Next.js in production mode
  pack           Create deployment-package.zip
  upload         Upload package to server
  remote         Run remote deploy steps (unzip, npm ci, pm2)
  deploy         Upload + remote
  ship           Build + pack + deploy (set GIT_AUTO=1 to include git:auto)
  env:push       Upload ENV_FILE (.env.local by default) then restart PM2
  status         Show PM2 status and recent logs on server

Environment:
  SSH_HOST, SSH_USER, DEPLOY_PATH, PM2_APP_NAME, SSH_KEY_PATH, SSH_PASS, ENV_FILE, SKIP_BUILD, GIT_AUTO
USAGE
}

cmd=${1:-}
case "$cmd" in
  git:auto)        git_auto ;;
  build)           build ;;
  pack)            pack ;;
  upload)          upload ;;
  remote)          remote ;;
  deploy)          deploy_combo ;;
  ship)            ship ;;
  env:push)        env_push ;;
  status)          status ;;
  ""|help|-h|--help) usage ;;
  *) err "Unknown command: $cmd"; echo; usage; exit 1 ;;
esac

