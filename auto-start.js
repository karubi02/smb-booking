#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting development setup for SMB Booking...');

try {
  // Pull latest changes from GitHub
  console.log('📥 Pulling latest changes from GitHub...');
  execSync('git pull origin main', { stdio: 'inherit' });
  console.log('✅ Successfully pulled latest changes');
} catch (error) {
  console.log('⚠️  Warning: Git pull failed or no changes to pull');
}

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  try {
    execSync('pnpm install', { stdio: 'inherit' });
  } catch {
    console.log('pnpm not found, using npm...');
    execSync('npm install', { stdio: 'inherit' });
  }
} catch (error) {
  console.log('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Start development server
console.log('🌟 Starting development server on port 3008...');
try {
  execSync('pnpm dev --port 3008', { stdio: 'inherit' });
} catch {
  console.log('pnpm not found, using npm...');
  execSync('npm run dev -- --port 3008', { stdio: 'inherit' });
}
