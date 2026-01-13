/**
 * Hotel Comparison Worker
 * Runs the hotel comparison bot to collect real pricing data
 */

import { runMultipleComparisons } from "./server/hotelComparison";

async function main() {
  const count = parseInt(process.env.COMPARISON_COUNT || "1", 10);
  
  try {
    await runMultipleComparisons(count);
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
