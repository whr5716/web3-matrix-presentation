#!/usr/bin/env node

/**
 * Hotel Comparison Bot Runner
 * 
 * This script runs the hotel comparison bot to collect real pricing data
 * from Wholesale Hotel Rates and public booking sites for major worldwide cities.
 * 
 * Usage:
 *   node run-hotel-comparisons.mjs [count]
 * 
 * Examples:
 *   node run-hotel-comparisons.mjs          # Run 1 comparison
 *   node run-hotel-comparisons.mjs 3        # Run 3 comparisons
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get count from command line args (default 1)
const count = parseInt(process.argv[2] || '1', 10);

if (isNaN(count) || count < 1) {
  console.error('❌ Invalid count. Please provide a positive number.');
  console.error('Usage: node run-hotel-comparisons.mjs [count]');
  process.exit(1);
}

console.log(`\n🏨 Hotel Comparison Bot Runner`);
console.log(`📊 Will run ${count} hotel comparison(s)\n`);

// Create a Node process to run the bot
const child = spawn('node', [
  '--loader', 'tsx',
  '--no-warnings',
  join(__dirname, 'run-comparisons-worker.ts')
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    COMPARISON_COUNT: count.toString(),
  },
  cwd: __dirname,
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✨ Hotel comparisons completed successfully!');
  } else {
    console.error(`\n❌ Bot exited with code ${code}`);
  }
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('❌ Error running bot:', err);
  process.exit(1);
});
