#!/bin/bash
# 🚀 One-click Railway Deployment Setup
# This script prepares your repo and opens Railway for deployment

set -e

echo "═══════════════════════════════════════════════"
echo "  नागरिक सरोकार — Railway Deploy Prep"
echo "═══════════════════════════════════════════════"

# 1. Check we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Run this from the Laravel project root"
    exit 1
fi

echo "✅ Project detected"

# 2. Make sure git is up to date
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes found. Committing..."
    git add -A
    git commit -m "Pre-deployment commit" || true
fi

echo "✅ Git clean"

# 3. Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub"

# 4. Open Railway deploy page
echo ""
echo "═══════════════════════════════════════════════"
echo "  🚀 NEXT STEP: Deploy on Railway"
echo "═══════════════════════════════════════════════"
echo ""
echo "  1. Go to:  https://railway.app/new"
echo "  2. Sign in with GitHub"
echo "  3. Select repo: dhakalnitesh/complain_tracking"
echo "  4. Click 'Deploy'"
echo "  5. Add MySQL plugin from dashboard"
echo "  6. In Railway shell, run:"
echo ""
echo "     php artisan key:generate --force"
echo "     php artisan migrate --seed --force"
echo ""
echo "  ⏱  Total time: ~3 minutes"
echo ""
echo "═══════════════════════════════════════════════"
