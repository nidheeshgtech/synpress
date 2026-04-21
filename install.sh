#!/bin/bash
echo ""
echo "⚡ Installing Synpress..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install from https://nodejs.org"
  exit 1
fi

echo "✓ Node.js $(node -v) found"

# Install dependencies
npm install

# Create config folder
mkdir -p config

echo ""
echo "✅ Synpress installed!"
echo ""
echo "▶ Run with:  npm start"
echo "🌐 Open:     http://localhost:3030"
echo ""
