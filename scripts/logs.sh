#!/usr/bin/env bash
SERVICE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../infra"
docker compose logs -f $SERVICE
