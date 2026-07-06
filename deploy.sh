#!/bin/bash
# नागरिक सरोकार — Deployment Script for Hackathon Demo
# Usage: bash deploy.sh [local|network]

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

case "${1:-local}" in
  local)
    echo "🚀 Starting on http://localhost:8000"
    php artisan serve --port=8000
    ;;
  network)
    IP=$(hostname -I | awk '{print $1}')
    echo "📡 Starting on http://$IP:8000 — scan the QR code from any device on same WiFi"
    echo ""
    echo "🔧 To update QR code for this IP, run:"
    echo "   python3 -c \"import qrcode; qrcode.make('http://$IP:8000').save('public/qr-demo.png')\""
    php artisan serve --host=0.0.0.0 --port=8000
    ;;
  fresh)
    echo "🗄️  Refreshing database..."
    php artisan migrate:fresh --seed --force
    echo "✅ Done. Run 'bash deploy.sh' to start."
    ;;
  build)
    echo "📦 Building frontend..."
    npm run build
    echo "✅ Build complete."
    ;;
  *)
    echo "Usage: bash deploy.sh [local|network|fresh|build]"
    exit 1
    ;;
esac
