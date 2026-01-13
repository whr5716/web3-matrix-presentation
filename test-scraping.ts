/**
 * Test script to verify hotel comparison bot scraping works
 * Run with: npx tsx test-scraping.ts
 */

import { runHotelComparison } from "./server/hotelComparison";

async function main() {
  console.log("🧪 Testing hotel comparison bot scraping...\n");
  
  try {
    // Test with a specific hotel for debugging
    await runHotelComparison({
      hotelName: "Hilton",
      location: "London",
      checkInDate: "2025-03-15",
      checkOutDate: "2025-03-18",
      starRating: 5,
    });
    
    console.log("\n✅ Test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

main();
