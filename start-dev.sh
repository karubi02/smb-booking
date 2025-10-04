#!/bin/bash

# Script to pull latest changes and start development server
echo "🚀 Starting development setup for Opening Hours..."

# Change to the project directory
cd "$(dirname "$0")"

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Check if pull was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully pulled latest changes"
else
    echo "⚠️  Warning: Git pull failed or no changes to pull"
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
else
    echo "Using npm..."
    npm install
fi

# Start development server
echo "🌟 Starting development server on port 3008..."
if command -v pnpm &> /dev/null; then
    pnpm dev --port 3008
else
    npm run dev -- --port 3008
fi
