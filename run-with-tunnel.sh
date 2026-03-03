#!/bin/bash
# Run the app with a public tunnel URL - bypasses Cursor port forwarding issues
cd "$(dirname "$0")"

cleanup() {
  echo ""
  echo "Stopping..."
  pkill -f "next dev" 2>/dev/null || true
  pkill -f localtunnel 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

pkill -f "next dev" 2>/dev/null || true
sleep 2

echo "Setting up database..."
npm run setup

echo ""
echo "Starting dev server..."
npm run dev &
sleep 10

PORT=3000
curl -s http://127.0.0.1:3000/api/health >/dev/null 2>&1 || PORT=3001

echo ""
echo "=========================================="
echo "  Tunnel starting - open the URL below!"
echo "  (Click 'Click to Continue' on first visit)"
echo "  Login: Admin or admin@demo.com / demo123"
echo "=========================================="
echo ""
npx --yes localtunnel --port $PORT
