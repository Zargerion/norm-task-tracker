#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "🚀 Starting Norm Task Tracker (dev mode)..."

# Create .env files if missing
if [ ! -f "$ROOT/backend/.env" ]; then
  echo "📋 Creating backend/.env from example..."
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
fi

if [ ! -f "$ROOT/frontend/.env" ]; then
  echo "📋 Creating frontend/.env from example..."
  cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"
fi

# Check if docker is available
if command -v docker &>/dev/null; then
  echo "🐳 Starting PostgreSQL via Docker..."
  docker run -d \
    --name ntt-db-dev \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=norm_task_tracker \
    -p 5432:5432 \
    --rm \
    postgres:16-alpine 2>/dev/null || echo "  (db container already running)"
  sleep 2
fi

# Install deps
echo "📦 Installing backend dependencies..."
cd "$ROOT/backend" && yarn install

echo "📦 Installing frontend dependencies..."
cd "$ROOT/frontend" && yarn install

# Run migrations + seed
echo "🗄 Running DB migrations..."
cd "$ROOT/backend"
yarn prisma:generate
yarn prisma:migrate:dev --name init 2>/dev/null || true
yarn prisma:seed

# Start services in background
echo "🔧 Starting backend (port 4000)..."
cd "$ROOT/backend" && yarn dev &
BACKEND_PID=$!

echo "🎨 Starting frontend (port 3000)..."
cd "$ROOT/frontend" && yarn dev &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000/api"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '👋 Stopped.'" INT TERM
wait
