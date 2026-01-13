/**
 * Test script to verify hotel comparison bot scraping works
 * This version skips database writes to test the scraping logic
 * Run with: npx tsx test-scraping-no-db.ts
 */

import { chromium } from "playwright";

async function testWholesaleHotelRates() {
  console.log("\n🧪 Testing Wholesale Hotel Rates scraping...\n");
  
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  try {
    console.log("📍 Navigating to Wholesale Hotel Rates login...");
    await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    console.log("✅ Login page loaded");
    console.log("📝 Looking for login form...");

    // Check if already logged in
    const loginButton = await page.$('button:has-text("Log In")');
    
    if (loginButton) {
      console.log("🔐 Found login button, filling credentials...");
      
      // Try different selectors for username/password fields
      const usernameInput = await page.$('input[name="username"], input[type="text"], input[placeholder*="username"], input[placeholder*="Username"]');
      const passwordInput = await page.$('input[name="password"], input[type="password"], input[placeholder*="password"], input[placeholder*="Password"]');
      
      if (usernameInput && passwordInput) {
        console.log("✅ Found input fields");
        await usernameInput.fill("web3demo");
        console.log("✅ Entered username");
        
        await passwordInput.fill("web3demo!@");
        console.log("✅ Entered password");
        
        await loginButton.click();
        console.log("✅ Clicked login button");
        
        // Wait for navigation
        await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
        console.log("✅ Login successful, navigated to next page");
      } else {
        console.log("❌ Could not find input fields");
        console.log("   Username input:", usernameInput ? "found" : "not found");
        console.log("   Password input:", passwordInput ? "found" : "not found");
      }
    } else {
      console.log("✅ Already logged in (no login button found)");
    }

    // Try to find booking platform link
    console.log("\n📍 Looking for booking platform link...");
    const bookingLink = await page.$('a:has-text("Go To Booking Platform"), a[href*="booking"], button:has-text("Booking")');
    
    if (bookingLink) {
      console.log("✅ Found booking platform link");
      await bookingLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
      console.log("✅ Navigated to booking platform");
    } else {
      console.log("⚠️  Booking platform link not found, checking current page...");
    }

    // Take screenshot to see current state
    const screenshot = await page.screenshot({ path: "/tmp/whr-screenshot.png", fullPage: true });
    console.log("\n📸 Screenshot saved to /tmp/whr-screenshot.png");

    console.log("\n✨ Wholesale Hotel Rates test completed!");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    // Keep browser open for 10 seconds so you can see the result
    console.log("\n⏳ Browser will close in 10 seconds...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testWholesaleHotelRates();
