#!/bin/bash
# Run the Industrial Tooling Management app (cloud workspace)
# Tool and trolley management with tickets, KPIs, Excel import/export
set -e
cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Setting up database (migrations + seed)..."
npm run setup

echo ""
echo "Starting dev server..."
echo "Once ready, open the Ports tab and click Open in Browser for port 3000 (or 3001 if 3000 is busy)"
echo "Or use Simple Browser: http://localhost:3000"
echo ""
npm run dev
