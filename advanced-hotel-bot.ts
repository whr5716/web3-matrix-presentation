import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

interface HotelComparison {
  city: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  whrPrice: number | null;
  hotelsComPrice: number | null;
  expediaPrice: number | null;
  bookingComPrice: number | null;
  savings: number | null;
  savingsPercent: number | null;
}

const CITIES = [
  "Tokyo",
  "London",
  "New York",
  "Paris",
  "Dubai",
  "Singapore",
  "Hong Kong",
  "Sydney",
  "Bangkok",
  "Barcelona",
];

const HOTELS = ["Hilton", "Marriott", "Hyatt", "Four Seasons", "InterContinental"];

function getRandomCity(): string {
  return CITIES[Math.floor(Math.random() * CITIES.length)];
}

function getRandomHotel(): string {
  return HOTELS[Math.floor(Math.random() * HOTELS.length)];
}

function generateDates(): { checkIn: string; checkOut: string } {
  const today = new Date();
  const checkInDate = new Date(
    today.getTime() + Math.random() * (37 - 7) * 24 * 60 * 60 * 1000 + 7 * 24 * 60 * 60 * 1000
  );
  const checkOutDate = new Date(
    checkInDate.getTime() + (3 + Math.floor(Math.random() * 3)) * 24 * 60 * 60 * 1000
  );

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  return { checkIn: formatDate(checkInDate), checkOut: formatDate(checkOutDate) };
}

async function scrapeWholesaleHotelRates(
  city: string,
  hotel: string,
  checkIn: string,
  checkOut: string
): Promise<number | null> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();

  try {
    console.log(`[WHR] Logging in...`);
    await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Login
    const usernameInput = await page.$("input[type='text']");
    const passwordInput = await page.$("input[type='password']");

    if (usernameInput && passwordInput) {
      await usernameInput.fill("web3demo");
      await passwordInput.fill("web3demo!@");
      await page.click("button[type='submit']");
      await page.waitForURL("**/search**", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    console.log(`[WHR] Searching for ${hotel} in ${city}...`);

    // Fill search form
    const cityInput = await page.$("#city");
    const checkInInput = await page.$("#theCheckIn");
    const checkOutInput = await page.$("#theCheckOut");

    if (cityInput && checkInInput && checkOutInput) {
      await cityInput.fill(city);
      await checkInInput.fill(checkIn);
      await checkOutInput.fill(checkOut);
      await page.click("#theSubmitButton");
      await page.waitForTimeout(3000);
    }

    // Extract price with multiple selectors
    let price: number | null = null;
    const priceSelectors = [
      ".price-display",
      "[class*='price']",
      ".hotel-price",
      "[data-testid='price']",
      ".amount",
    ];

    for (const selector of priceSelectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        if (text) {
          const match = text.match(/\d+\.?\d*/);
          if (match) {
            price = parseFloat(match[0]);
            break;
          }
        }
      }
    }

    console.log(`[WHR] Found price: $${price || "N/A"}`);
    return price;
  } catch (error) {
    console.error(`[WHR] Error:`, error);
    return null;
  } finally {
    await page.close();
    await browser.close();
  }
}

async function scrapeHotelsComPrice(
  city: string,
  hotel: string,
  checkIn: string,
  checkOut: string
): Promise<number | null> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();

  try {
    console.log(`[Hotels.com] Searching for ${hotel} in ${city}...`);
    const searchUrl = `https://www.hotels.com/search.do?destination=${encodeURIComponent(city)}&startDate=${checkIn}&endDate=${checkOut}`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Try multiple price selectors
    let price: number | null = null;
    const priceSelectors = [
      "[data-testid='price']",
      ".price",
      ".amount",
      "[class*='price']",
      ".hotel-price",
    ];

    for (const selector of priceSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            const match = text.match(/\d+\.?\d*/);
            if (match) {
              price = parseFloat(match[0]);
              break;
            }
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    console.log(`[Hotels.com] Found price: $${price || "N/A"}`);
    return price;
  } catch (error) {
    console.error(`[Hotels.com] Error:`, error);
    return null;
  } finally {
    await page.close();
    await browser.close();
  }
}

async function scrapeExpediaPrice(
  city: string,
  hotel: string,
  checkIn: string,
  checkOut: string
): Promise<number | null> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();

  try {
    console.log(`[Expedia] Searching for ${hotel} in ${city}...`);
    const searchUrl = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(city)}&startDate=${checkIn}&endDate=${checkOut}`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Try multiple price selectors
    let price: number | null = null;
    const priceSelectors = [
      "[data-testid='price']",
      ".price",
      ".amount",
      "[class*='price']",
      ".hotel-price",
    ];

    for (const selector of priceSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            const match = text.match(/\d+\.?\d*/);
            if (match) {
              price = parseFloat(match[0]);
              break;
            }
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    console.log(`[Expedia] Found price: $${price || "N/A"}`);
    return price;
  } catch (error) {
    console.error(`[Expedia] Error:`, error);
    return null;
  } finally {
    await page.close();
    await browser.close();
  }
}

async function runComparison(): Promise<void> {
  const city = getRandomCity();
  const hotel = getRandomHotel();
  const { checkIn, checkOut } = generateDates();

  console.log(`\n🏨 Starting hotel comparison for ${hotel} in ${city}`);
  console.log(`📅 Dates: ${checkIn} to ${checkOut}\n`);

  // Scrape all sources sequentially with delays
  const whrPrice = await scrapeWholesaleHotelRates(city, hotel, checkIn, checkOut);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const hotelsComPrice = await scrapeHotelsComPrice(city, hotel, checkIn, checkOut);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const expediaPrice = await scrapeExpediaPrice(city, hotel, checkIn, checkOut);

  // Calculate savings
  const avgPublicPrice =
    (hotelsComPrice || 0) + (expediaPrice || 0) / 2 || null;
  const savings = whrPrice && avgPublicPrice ? avgPublicPrice - whrPrice : null;
  const savingsPercent = savings && avgPublicPrice ? (savings / avgPublicPrice) * 100 : null;

  // Create comparison object
  const comparison: HotelComparison = {
    city,
    hotelName: hotel,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    whrPrice,
    hotelsComPrice,
    expediaPrice,
    bookingComPrice: null,
    savings,
    savingsPercent,
  };

  // Save results
  const resultsDir = "/home/ubuntu/hotel-comparison-results";
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const jsonPath = path.join(resultsDir, `comparison-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(comparison, null, 2));

  console.log(`\n✅ Comparison Results:`);
  console.log(`   WHR Price: $${comparison.whrPrice || "N/A"}`);
  console.log(`   Hotels.com Price: $${comparison.hotelsComPrice || "N/A"}`);
  console.log(`   Expedia Price: $${comparison.expediaPrice || "N/A"}`);
  console.log(
    `   Savings: $${comparison.savings?.toFixed(2) || "N/A"} (${comparison.savingsPercent?.toFixed(1) || "N/A"}%)`
  );
  console.log(`   Results saved to: ${jsonPath}\n`);
}

// Run the bot
(async () => {
  try {
    // Run 1 comparison
    await runComparison();
    console.log("✨ Comparison complete!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})();
