#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

TAG="${1:-latest}"

echo "🏗 Building Docker images (tag: $TAG)..."

docker build -t "norm-task-tracker/backend:$TAG" "$ROOT/backend"
docker build -t "norm-task-tracker/frontend:$TAG" "$ROOT/frontend"

echo "✅ Images built:"
echo "   norm-task-tracker/backend:$TAG"
echo "   norm-task-tracker/frontend:$TAG"
