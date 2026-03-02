#!/bin/bash
# Run the Industrial Tooling Management app (cloud workspace)
set -e
cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Applying database migrations..."
npm run db:migrate

echo "Seeding demo data..."
npm run db:seed

echo ""
echo "Starting dev server..."
echo "Once ready, open the Ports tab and click Open in Browser for port 3000 (or 3001 if 3000 is busy)"
echo "Or use Simple Browser: http://localhost:3000"
echo ""
npm run dev
