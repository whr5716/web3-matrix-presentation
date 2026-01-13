/**
 * Test scraping without database writes
 * Run with: npx tsx test-scraping-only.ts
 */

import { chromium } from "playwright";

async function testScrapingOnly() {
  console.log("\n🧪 Testing Wholesale Hotel Rates scraping (no DB)\n");
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const hotelName = "Hilton";
    const location = "London";
    const checkInDate = "2025-03-15";
    const checkOutDate = "2025-03-18";
    
    console.log(`🏨 Searching for ${hotelName} in ${location}`);
    console.log(`📅 ${checkInDate} to ${checkOutDate}\n`);
    
    // Navigate to WHR login
    console.log("[1/7] Navigating to login page...");
    await page.goto("https://web3demo.wholesalehotelrates.com/login");
    console.log("✅ Login page loaded");
    
    // Login with demo credentials
    console.log("[2/7] Logging in...");
    await page.fill('input[name="username"]', "web3demo");
    await page.fill('input[name="password"]', "web3demo!@");
    await page.click('button:has-text("Log In")');
    await page.waitForNavigation();
    console.log("✅ Logged in successfully");
    
    // Click "Go to Booking Platform"
    console.log("[3/7] Navigating to booking platform...");
    await page.click('a:has-text("Go To Booking Platform")');
    await page.waitForNavigation();
    console.log("✅ Booking platform loaded");
    
    // Fill search form
    console.log("[4/7] Filling search form...");
    await page.fill('input#city', location);
    await page.click('li:has-text("' + location + '")');
    await page.fill('input#theCheckIn', checkInDate);
    await page.fill('input#theCheckOut', checkOutDate);
    console.log("✅ Form filled");
    
    // Submit search
    console.log("[5/7] Submitting search...");
    await page.click('input#theSubmitButton');
    await page.waitForNavigation();
    console.log("✅ Search submitted");
    
    // Wait for results
    console.log("[6/7] Waiting for hotel results...");
    await page.waitForSelector('a:has-text("' + hotelName + '")', {
      timeout: 10000,
    });
    console.log("✅ Hotel found in results");
    
    // Click hotel
    console.log("[7/7] Clicking hotel to view pricing...");
    await page.click('a:has-text("' + hotelName + '")');
    await page.waitForNavigation();
    console.log("✅ Hotel pricing page loaded");
    
    // Extract price
    const pricePerNight = await page.evaluate(() => {
      const priceElement = document.querySelector('[class*="price"]');
      if (priceElement) {
        const text = priceElement.textContent || "";
        const match = text.match(/\$?(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
      }
      return 0;
    });
    
    const nights = 3; // checkOut - checkIn
    const totalPrice = pricePerNight * nights;
    
    console.log("\n💰 PRICING RESULTS:");
    console.log("==================");
    console.log(`Price per night: $${pricePerNight}`);
    console.log(`Number of nights: ${nights}`);
    console.log(`Total price: $${totalPrice}`);
    console.log("==================\n");
    
    if (pricePerNight > 0) {
      console.log("✨ SUCCESS! Scraping worked and extracted real pricing data!\n");
    } else {
      console.log("⚠️  Price extraction returned 0, but navigation succeeded\n");
    }
    
  } catch (error) {
    console.error("\n❌ ERROR:", error);
  } finally {
    await browser.close();
  }
}

testScrapingOnly();
