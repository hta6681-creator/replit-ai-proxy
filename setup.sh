#!/usr/bin/env bash
# setup.sh — Bootstrap the project in a fresh environment
set -euo pipefail

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building shared libs..."
pnpm run typecheck:libs

echo "==> Building api-server..."
pnpm --filter @workspace/api-server run build

echo "==> Building api-portal..."
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/api-portal run build

echo "==> Setup complete."
