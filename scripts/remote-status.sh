#!/usr/bin/env bash
set -euo pipefail

# Deprecated: unified into deploy.sh. This wrapper calls the new CLI.
echo "[remote-status] Using unified deploy.sh status. This script is deprecated."
bash "$(dirname "$0")/../deploy.sh" status
