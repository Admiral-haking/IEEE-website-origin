#!/usr/bin/env bash
set -euo pipefail

# Deprecated: unified into deploy.sh. This wrapper calls the new CLI.
echo "[remote-deploy] Using unified deploy.sh. This script is deprecated."
# Respect SKIP_BUILD=1 to avoid rebuild
cmd=deploy
if [[ -z "${SKIP_BUILD:-}" ]]; then cmd=ship; fi
bash "$(dirname "$0")/../deploy.sh" "$cmd"
