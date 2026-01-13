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
  screenshot: string;
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
  "Rome",
  "Amsterdam",
  "Toronto",
  "Mexico City",
  "São Paulo",
];

const HOTELS = [
  "Hilton",
  "Marriott",
  "Hyatt",
  "Four Seasons",
  "Ritz-Carlton",
  "InterContinental",
  "Sheraton",
  "Westin",
];

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
): Promise<{ price: number | null; screenshot: string }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[WHR] Logging in...`);
    await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Login
    const usernameInput = await page.$("input[type='text']");
    const passwordInput = await page.$("input[type='password']");

    if (usernameInput && passwordInput) {
      await usernameInput.fill("web3demo");
      await passwordInput.fill("web3demo!@");
      await page.click("button[type='submit']");
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
    }

    console.log(`[WHR] Searching for ${hotel} in ${city}...`);
    await page.goto("https://web3demo.wholesalehotelrates.com/search", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Fill search form
    const cityInput = await page.$("#city");
    const checkInInput = await page.$("#theCheckIn");
    const checkOutInput = await page.$("#theCheckOut");

    if (cityInput && checkInInput && checkOutInput) {
      await cityInput.fill(city);
      await checkInInput.fill(checkIn);
      await checkOutInput.fill(checkOut);
      await page.click("#theSubmitButton");
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
    }

    // Extract price
    const priceText = await page.textContent(".price-display, [class*='price']");
    const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : null;

    // Take screenshot
    const screenshotPath = `/tmp/whr-${city}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });

    console.log(`[WHR] Found price: $${price || "N/A"}`);
    return { price, screenshot: screenshotPath };
  } catch (error) {
    console.error(`[WHR] Error:`, error);
    return { price: null, screenshot: "" };
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
): Promise<{ price: number | null; screenshot: string }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[Hotels.com] Searching for ${hotel} in ${city}...`);
    const searchUrl = `https://www.hotels.com/search.do?destination=${city}&startDate=${checkIn}&endDate=${checkOut}`;
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });

    // Wait for results and extract price
    await page.waitForSelector("[data-testid='price'], .price", { timeout: 10000 }).catch(() => {});
    const priceText = await page.textContent("[data-testid='price'], .price");
    const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : null;

    // Take screenshot
    const screenshotPath = `/tmp/hotels-com-${city}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });

    console.log(`[Hotels.com] Found price: $${price || "N/A"}`);
    return { price, screenshot: screenshotPath };
  } catch (error) {
    console.error(`[Hotels.com] Error:`, error);
    return { price: null, screenshot: "" };
  } finally {
    await browser.close();
  }
}

async function scrapeExpediaPrice(
  city: string,
  hotel: string,
  checkIn: string,
  checkOut: string
): Promise<{ price: number | null; screenshot: string }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`[Expedia] Searching for ${hotel} in ${city}...`);
    const searchUrl = `https://www.expedia.com/Hotel-Search?destination=${city}&startDate=${checkIn}&endDate=${checkOut}`;
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });

    // Wait for results and extract price
    await page.waitForSelector("[data-testid='price'], .price", { timeout: 10000 }).catch(() => {});
    const priceText = await page.textContent("[data-testid='price'], .price");
    const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : null;

    // Take screenshot
    const screenshotPath = `/tmp/expedia-${city}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });

    console.log(`[Expedia] Found price: $${price || "N/A"}`);
    return { price, screenshot: screenshotPath };
  } catch (error) {
    console.error(`[Expedia] Error:`, error);
    return { price: null, screenshot: "" };
  } finally {
    await browser.close();
  }
}

async function runComparison(): Promise<void> {
  const city = getRandomCity();
  const hotel = getRandomHotel();
  const { checkIn, checkOut } = generateDates();

  console.log(`\n🏨 Starting hotel comparison for ${hotel} in ${city}`);
  console.log(`📅 Dates: ${checkIn} to ${checkOut}\n`);

  // Scrape all sources
  const [whrResult, hotelsComResult, expediaResult] = await Promise.all([
    scrapeWholesaleHotelRates(city, hotel, checkIn, checkOut),
    scrapeHotelsComPrice(city, hotel, checkIn, checkOut),
    scrapeExpediaPrice(city, hotel, checkIn, checkOut),
  ]);

  // Calculate savings
  const avgPublicPrice =
    (hotelsComResult.price || 0) + (expediaResult.price || 0) / 2 || null;
  const savings = whrResult.price && avgPublicPrice ? avgPublicPrice - whrResult.price : null;
  const savingsPercent = savings && avgPublicPrice ? (savings / avgPublicPrice) * 100 : null;

  // Create comparison object
  const comparison: HotelComparison = {
    city,
    hotelName: hotel,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    whrPrice: whrResult.price,
    hotelsComPrice: hotelsComResult.price,
    expediaPrice: expediaResult.price,
    bookingComPrice: null,
    savings,
    savingsPercent,
    screenshot: whrResult.screenshot,
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
  console.log(`   Savings: $${comparison.savings?.toFixed(2) || "N/A"} (${comparison.savingsPercent?.toFixed(1) || "N/A"}%)`);
  console.log(`   Results saved to: ${jsonPath}\n`);
}

// Run the bot
(async () => {
  try {
    // Run 3 comparisons
    for (let i = 0; i < 3; i++) {
      await runComparison();
      console.log(`---\n`);
    }
    console.log("✨ All comparisons complete!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})();
