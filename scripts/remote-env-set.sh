#!/usr/bin/env bash
set -euo pipefail

# Deprecated: unified into deploy.sh. This wrapper calls the new CLI.
echo "[remote-env-set] Using unified deploy.sh env:push. This script is deprecated."
bash "$(dirname "$0")/../deploy.sh" env:push
