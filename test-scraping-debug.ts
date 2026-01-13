/**
 * Detailed debugging script for hotel comparison bot
 * Shows exactly what's happening at each step
 * Run with: npx tsx test-scraping-debug.ts
 */

import { chromium } from "playwright";

async function testWholesaleHotelRates() {
  console.log("\n🧪 DETAILED SCRAPING TEST - Wholesale Hotel Rates\n");
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
    // Step 1: Navigate to login page
    console.log("\n[STEP 1] Navigating to login page...");
    console.log("URL: https://web3demo.wholesalehotelrates.com/login");
    
    const response = await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    
    console.log("✅ Response status:", response?.status());
    console.log("✅ Page title:", await page.title());
    
    // Step 2: Check page content
    console.log("\n[STEP 2] Analyzing page content...");
    
    const pageContent = await page.content();
    console.log("Page length:", pageContent.length, "characters");
    
    // Look for login form elements
    const hasLoginForm = await page.$('form');
    console.log("Has form element:", !!hasLoginForm);
    
    const usernameInputs = await page.$$('input[type="text"], input[name="username"], input[placeholder*="username"], input[placeholder*="Username"]');
    console.log("Found username inputs:", usernameInputs.length);
    
    const passwordInputs = await page.$$('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]');
    console.log("Found password inputs:", passwordInputs.length);
    
    const buttons = await page.$$('button');
    console.log("Found buttons:", buttons.length);
    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      const text = await buttons[i].textContent();
      console.log(`  - Button ${i + 1}: "${text?.trim()}"`);
    }
    
    // Step 3: Try to log in
    console.log("\n[STEP 3] Attempting login...");
    console.log("Username: web3demo");
    console.log("Password: web3demo!@");
    
    // Try to find and fill username
    const usernameInput = await page.$('input[name="username"]');
    if (usernameInput) {
      console.log("✅ Found username input with name='username'");
      await usernameInput.fill("web3demo");
      console.log("✅ Filled username");
    } else {
      console.log("❌ Could not find username input with name='username'");
      console.log("   Trying alternative selectors...");
      
      const altUsername = await page.$('input[type="text"]');
      if (altUsername) {
        console.log("✅ Found text input, using it as username");
        await altUsername.fill("web3demo");
        console.log("✅ Filled username");
      }
    }
    
    // Try to find and fill password
    const passwordInput = await page.$('input[name="password"]');
    if (passwordInput) {
      console.log("✅ Found password input with name='password'");
      await passwordInput.fill("web3demo!@");
      console.log("✅ Filled password");
    } else {
      console.log("❌ Could not find password input with name='password'");
      
      const altPassword = await page.$('input[type="password"]');
      if (altPassword) {
        console.log("✅ Found password input, using it");
        await altPassword.fill("web3demo!@");
        console.log("✅ Filled password");
      }
    }
    
    // Step 4: Click login button
    console.log("\n[STEP 4] Clicking login button...");
    
    const loginButton = await page.$('button:has-text("Log In"), button:has-text("Login"), button[type="submit"]');
    if (loginButton) {
      console.log("✅ Found login button");
      const buttonText = await loginButton.textContent();
      console.log(`   Button text: "${buttonText?.trim()}"`);
      
      await loginButton.click();
      console.log("✅ Clicked login button");
      
      // Wait for navigation
      console.log("⏳ Waiting for page navigation...");
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(e => {
        console.log("⚠️  Navigation timeout or error:", e.message);
      });
      
      console.log("✅ Navigation complete");
      console.log("Current URL:", page.url());
      console.log("Current title:", await page.title());
    } else {
      console.log("❌ Could not find login button");
      console.log("   Listing all buttons on page:");
      const allButtons = await page.$$('button');
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const type = await allButtons[i].getAttribute('type');
        console.log(`   - Button ${i + 1}: "${text?.trim()}" (type: ${type})`);
      }
    }
    
    // Step 5: Look for booking platform link
    console.log("\n[STEP 5] Looking for booking platform link...");
    
    const links = await page.$$('a');
    console.log("Found links:", links.length);
    
    for (let i = 0; i < Math.min(10, links.length); i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      if (text?.toLowerCase().includes('booking') || href?.includes('booking')) {
        console.log(`✅ Found booking link: "${text?.trim()}" (${href})`);
      }
    }
    
    // Step 6: Take screenshot
    console.log("\n[STEP 6] Taking screenshot...");
    const screenshot = await page.screenshot({ path: "/tmp/whr-debug.png", fullPage: true });
    console.log("✅ Screenshot saved to /tmp/whr-debug.png");
    console.log("   Size:", screenshot.length, "bytes");
    
    console.log("\n" + "=".repeat(80));
    console.log("✨ Test completed!\n");
    
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.log("\n" + "=".repeat(80));
  } finally {
    await browser.close();
  }
}

testWholesaleHotelRates();
