#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "🌱 Running database seed..."
cd "$ROOT/backend"
yarn prisma:seed
echo "✅ Seed complete"
