import { chromium } from "playwright";

async function debugWHR() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Logging in to WHR...");
    await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "domcontentloaded",
    });

    const usernameInput = await page.$("input[type='text']");
    const passwordInput = await page.$("input[type='password']");

    if (usernameInput && passwordInput) {
      await usernameInput.fill("web3demo");
      await passwordInput.fill("web3demo!@");
      await page.click("button[type='submit']");
      await page.waitForURL("**/search**", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    console.log("Navigating to search page...");
    await page.goto("https://web3demo.wholesalehotelrates.com/search", {
      waitUntil: "domcontentloaded",
    });

    // Fill search form
    const cityInput = await page.$("#city");
    const checkInInput = await page.$("#theCheckIn");
    const checkOutInput = await page.$("#theCheckOut");

    if (cityInput && checkInInput && checkOutInput) {
      await cityInput.fill("London");
      await checkInInput.fill("2026-02-15");
      await checkOutInput.fill("2026-02-18");
      await page.click("#theSubmitButton");
      await page.waitForTimeout(5000);
    }

    // Get the full HTML to inspect structure
    const html = await page.content();
    console.log("\n=== PAGE HTML ===");
    console.log(html.substring(0, 5000));
    console.log("\n=== END HTML ===\n");

    // Try to find all elements with price-like content
    const allText = await page.textContent("body");
    console.log("\n=== SEARCHING FOR PRICES IN TEXT ===");
    const priceMatches = allText?.match(/\$\s*\d+\.?\d*/g) || [];
    console.log("Found prices:", priceMatches);

    // List all class names that contain "price"
    const priceElements = await page.$$("[class*='price']");
    console.log(`\nFound ${priceElements.length} elements with 'price' in class name`);
    for (let i = 0; i < Math.min(5, priceElements.length); i++) {
      const text = await priceElements[i].textContent();
      const classes = await priceElements[i].getAttribute("class");
      console.log(`  [${i}] Classes: ${classes}, Text: ${text}`);
    }

    // List all data-testid attributes
    const testIdElements = await page.$$("[data-testid]");
    console.log(`\nFound ${testIdElements.length} elements with data-testid`);
    for (let i = 0; i < Math.min(10, testIdElements.length); i++) {
      const testId = await testIdElements[i].getAttribute("data-testid");
      const text = await testIdElements[i].textContent();
      console.log(`  [${i}] data-testid: ${testId}, Text: ${text?.substring(0, 50)}`);
    }

    // Take a screenshot
    await page.screenshot({ path: "/tmp/whr-debug.png" });
    console.log("\nScreenshot saved to /tmp/whr-debug.png");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await page.close();
    await browser.close();
  }
}

debugWHR();
