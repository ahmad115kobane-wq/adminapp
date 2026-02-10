#!/bin/bash
# Admin Dashboard - Production Deployment Script
# Usage: bash deploy.sh

set -e

echo "=========================================="
echo "  AppSport Admin Dashboard - Deploy"
echo "=========================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  No .env.local found. Creating from .env.example..."
  cp .env.example .env.local
  echo "📝 Please edit .env.local with your production API URL"
  echo "   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Build
echo "🔨 Building production bundle..."
npm run build

# Copy static files to standalone
echo "📁 Copying static assets..."
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static

echo ""
echo "✅ Build complete!"
echo ""
echo "To start with Node.js directly:"
echo "  PORT=3001 HOSTNAME=0.0.0.0 node .next/standalone/server.js"
echo ""
echo "To start with PM2:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "To start with Docker:"
echo "  docker build -t admin-dashboard ."
echo "  docker run -p 3001:3001 -e NEXT_PUBLIC_API_URL=https://your-api.com/api admin-dashboard"
echo ""
