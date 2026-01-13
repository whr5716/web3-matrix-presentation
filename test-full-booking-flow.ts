/**
 * Full booking flow test
 * Tests login, navigation to booking, and hotel search
 * Run with: npx tsx test-full-booking-flow.ts
 */

import { chromium } from "playwright";

async function testFullFlow() {
  console.log("\n🧪 FULL BOOKING FLOW TEST\n");
  console.log("=" .repeat(80));
  
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    ],
  });

  const page = await browser.newPage();

  try {
    // Step 1: Login
    console.log("\n[STEP 1] Login to Wholesale Hotel Rates");
    console.log("-".repeat(80));
    
    await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    console.log("✅ Login page loaded");
    
    const usernameInput = await page.$('input[type="text"]');
    const passwordInput = await page.$('input[type="password"]');
    const loginButton = await page.$('button:has-text("Log In")');
    
    if (usernameInput && passwordInput && loginButton) {
      await usernameInput.fill("web3demo");
      await passwordInput.fill("web3demo!@");
      await loginButton.click();
      console.log("✅ Credentials filled and login button clicked");
      
      // Wait for redirect
      await page.waitForTimeout(3000);
      console.log("✅ Logged in, current URL:", page.url());
    }
    
    // Step 2: Navigate to booking
    console.log("\n[STEP 2] Navigate to booking platform");
    console.log("-".repeat(80));
    
    await page.goto("https://web3demo.wholesalehotelrates.com/booking", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    console.log("✅ Booking page loaded, URL:", page.url());
    
    // Step 3: Inspect search form
    console.log("\n[STEP 3] Analyze search form");
    console.log("-".repeat(80));
    
    const inputs = await page.$$('input');
    console.log("Found inputs:", inputs.length);
    
    for (let i = 0; i < Math.min(8, inputs.length); i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const name = await inputs[i].getAttribute('name');
      const id = await inputs[i].getAttribute('id');
      const type = await inputs[i].getAttribute('type');
      console.log(`  Input ${i + 1}: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
    }
    
    // Step 4: Try to search for a hotel
    console.log("\n[STEP 4] Search for hotel");
    console.log("-".repeat(80));
    
    const location = "London";
    const checkIn = "2025-03-15";
    const checkOut = "2025-03-18";
    
    console.log(`Searching for: ${location}, ${checkIn} to ${checkOut}`);
    
    // Try different selectors for location input
    const locationInput = await page.$('input[placeholder*="city"], input[placeholder*="City"], input[placeholder*="location"], input[placeholder*="Location"], input[name*="location"], input[name*="city"]');
    
    if (locationInput) {
      console.log("✅ Found location input");
      await locationInput.fill(location);
      console.log(`✅ Filled location: ${location}`);
      
      // Wait for autocomplete
      await page.waitForTimeout(1000);
      
      // Try to click first autocomplete result
      const firstResult = await page.$('li:first-child, div[role="option"]:first-child, .autocomplete-item:first-child');
      if (firstResult) {
        await firstResult.click();
        console.log("✅ Selected autocomplete result");
      }
    } else {
      console.log("❌ Could not find location input");
    }
    
    // Try to fill check-in date
    const checkInInput = await page.$('input[placeholder*="Check-in"], input[placeholder*="check-in"], input[name*="checkin"], input[id*="checkin"]');
    if (checkInInput) {
      console.log("✅ Found check-in input");
      await checkInInput.fill(checkIn);
      console.log(`✅ Filled check-in: ${checkIn}`);
    } else {
      console.log("❌ Could not find check-in input");
    }
    
    // Try to fill check-out date
    const checkOutInput = await page.$('input[placeholder*="Check-out"], input[placeholder*="check-out"], input[name*="checkout"], input[id*="checkout"]');
    if (checkOutInput) {
      console.log("✅ Found check-out input");
      await checkOutInput.fill(checkOut);
      console.log(`✅ Filled check-out: ${checkOut}`);
    } else {
      console.log("❌ Could not find check-out input");
    }
    
    // Step 5: Submit search
    console.log("\n[STEP 5] Submit search");
    console.log("-".repeat(80));
    
    const submitButton = await page.$('button[type="submit"], button:has-text("Search"), input[type="submit"]');
    if (submitButton) {
      console.log("✅ Found submit button");
      const buttonText = await submitButton.textContent();
      console.log(`   Button text: "${buttonText?.trim()}"`);
      
      await submitButton.click();
      console.log("✅ Clicked submit button");
      
      // Wait for results
      await page.waitForTimeout(3000);
      console.log("✅ Waiting for results...");
      console.log("   Current URL:", page.url());
    } else {
      console.log("❌ Could not find submit button");
    }
    
    // Step 6: Check for results
    console.log("\n[STEP 6] Check for hotel results");
    console.log("-".repeat(80));
    
    const hotelElements = await page.$$('[class*="hotel"], [class*="result"], li, .card');
    console.log("Found potential hotel elements:", hotelElements.length);
    
    // Look for price elements
    const priceElements = await page.$$('[class*="price"], [class*="cost"], span:has-text("$")');
    console.log("Found potential price elements:", priceElements.length);
    
    if (priceElements.length > 0) {
      console.log("✅ Found price elements, extracting...");
      for (let i = 0; i < Math.min(3, priceElements.length); i++) {
        const text = await priceElements[i].textContent();
        console.log(`   Price ${i + 1}: ${text?.trim()}`);
      }
    }
    
    // Step 7: Take screenshot
    console.log("\n[STEP 7] Taking screenshot");
    console.log("-".repeat(80));
    
    const screenshot = await page.screenshot({ path: "/tmp/booking-flow.png", fullPage: true });
    console.log("✅ Screenshot saved to /tmp/booking-flow.png");
    console.log("   Size:", screenshot.length, "bytes");
    
    console.log("\n" + "=".repeat(80));
    console.log("✨ Full booking flow test completed!\n");
    
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.log("\n" + "=".repeat(80));
  } finally {
    await browser.close();
  }
}

testFullFlow();
