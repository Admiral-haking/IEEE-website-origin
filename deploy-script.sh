#!/usr/bin/env bash
set -euo pipefail

# Deprecated: unified into deploy.sh. This wrapper calls the new CLI.
echo "🚀 Using unified deploy.sh (ship). This script is deprecated."
bash "$(dirname "$0")/deploy.sh" ship
