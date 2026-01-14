import { chromium } from "playwright";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { hotelComparisons, priceData, comparisonResults } from "../drizzle/schema";

/**
 * Hotel comparison bot that collects pricing data and screenshots
 * from multiple booking platforms before the presentation
 * Uses headless mode with bot-detection evasion for reliability
 */

// Major worldwide cities with large populations for hotel comparisons
const MAJOR_CITIES = [
  { name: "Tokyo", country: "Japan", code: "TYO" },
  { name: "London", country: "United Kingdom", code: "LON" },
  { name: "New York", country: "United States", code: "NYC" },
  { name: "Paris", country: "France", code: "CDG" },
  { name: "Dubai", country: "United Arab Emirates", code: "DXB" },
  { name: "Singapore", country: "Singapore", code: "SIN" },
  { name: "Hong Kong", country: "Hong Kong", code: "HKG" },
  { name: "Sydney", country: "Australia", code: "SYD" },
  { name: "Bangkok", country: "Thailand", code: "BKK" },
  { name: "Barcelona", country: "Spain", code: "BCN" },
  { name: "Rome", country: "Italy", code: "FCO" },
  { name: "Amsterdam", country: "Netherlands", code: "AMS" },
  { name: "Toronto", country: "Canada", code: "YYZ" },
  { name: "Mexico City", country: "Mexico", code: "MEX" },
  { name: "São Paulo", country: "Brazil", code: "GIG" },
];

// Popular hotel chains that are likely to be available in multiple cities
const HOTEL_CHAINS = [
  "Hilton",
  "Marriott",
  "Hyatt",
  "Four Seasons",
  "Ritz-Carlton",
  "InterContinental",
  "Sheraton",
  "Westin",
];

interface HotelSearchParams {
  hotelName: string;
  location: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  starRating?: number;
}

interface PriceResult {
  platform: string;
  pricePerNight: number;
  totalPrice: number;
  screenshotUrl: string;
  extractedData: Record<string, any>;
}

/**
 * Get a random major city
 */
function getRandomCity() {
  return MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
}

/**
 * Get a random hotel chain
 */
function getRandomHotelChain() {
  return HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
}

/**
 * Generate realistic check-in/check-out dates (3-5 nights in the future)
 */
function generateDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 7); // 7-37 days from now
  
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 3); // 3-5 nights
  
  return {
    checkIn: checkIn.toISOString().split("T")[0],
    checkOut: checkOut.toISOString().split("T")[0],
  };
}

/**
 * Search Wholesale Hotel Rates and capture pricing
 */
async function searchWholesaleHotelRates(
  params: HotelSearchParams
): Promise<PriceResult | null> {
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
    // Navigate to WHR login
    console.log("Navigating to Wholesale Hotel Rates...");
    await page.goto("https://web3demo.wholesalehotelrates.com/login", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check if already logged in
    const loginButton = await page.$('button:has-text("Log In")');
    
    if (loginButton) {
      // Fill login form
      console.log("Logging in to Wholesale Hotel Rates...");
      await page.fill('input[name="username"]', "web3demo");
      await page.fill('input[name="password"]', "web3demo!@");
      await page.click('button:has-text("Log In")');
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
    }

    // Click "Go to Booking Platform" button
    console.log("Accessing booking platform...");
    const bookingLink = await page.$('a:has-text("Go To Booking Platform")');
    if (bookingLink) {
      await bookingLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
    } else {
      // If button not found, navigate directly
      await page.goto("https://web3demo.wholesalehotelrates.com/booking", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
    }

    // Fill search form
    console.log(`Searching for hotels in ${params.location}...`);
    
    // Find and fill city input
    const cityInput = await page.$('input[placeholder*="city"], input[placeholder*="City"], input#city');
    if (cityInput) {
      await cityInput.fill(params.location);
      await page.waitForTimeout(500); // Wait for autocomplete
      
      // Click first autocomplete result
      const firstResult = await page.$('li:first-child');
      if (firstResult) {
        await firstResult.click();
      }
    }

    // Fill check-in date
    const checkInInput = await page.$('input[placeholder*="Check-in"], input#theCheckIn');
    if (checkInInput) {
      await checkInInput.fill(params.checkInDate);
    }

    // Fill check-out date
    const checkOutInput = await page.$('input[placeholder*="Check-out"], input#theCheckOut');
    if (checkOutInput) {
      await checkOutInput.fill(params.checkOutDate);
    }

    // Submit search
    console.log("Submitting search...");
    const submitButton = await page.$('button[type="submit"], button:has-text("Search"), input#theSubmitButton');
    if (submitButton) {
      await submitButton.click();
    }

    // Wait for results
    await page.waitForTimeout(3000);
    await page.waitForSelector('a[href*="hotel"], div[class*="hotel"], li[class*="hotel"]', {
      timeout: 15000,
    }).catch(() => null);

    // Find hotel in results
    console.log(`Looking for ${params.hotelName} in results...`);
    const hotelLink = await page.$(`text=${params.hotelName}`);
    
    if (hotelLink) {
      await hotelLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 });
    } else {
      // If exact match not found, take first result
      const firstHotel = await page.$('a[href*="hotel"], div[class*="hotel-item"] a');
      if (firstHotel) {
        await firstHotel.click();
        await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 });
      }
    }

    // Capture screenshot
    console.log("Capturing screenshot...");
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotKey = `comparisons/${Date.now()}-whr-${params.location}.png`;
    const { url: screenshotUrl } = await storagePut(
      screenshotKey,
      screenshotBuffer,
      "image/png"
    );

    // Extract pricing data
    console.log("Extracting pricing data...");
    const pricePerNight = await page.evaluate(() => {
      // Try multiple selectors for price
      const selectors = [
        '[class*="price"]',
        '[class*="total"]',
        'span',
        '[data-price]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        const elementsArray = Array.from(elements);
        for (const el of elementsArray) {
          const text = el.textContent || "";
          const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            return parseFloat(match[1].replace(/,/g, ""));
          }
        }
      }

      return 0;
    });

    const nights = calculateNights(params.checkInDate, params.checkOutDate);
    const totalPrice = pricePerNight * nights;

    if (pricePerNight > 0) {
      return {
        platform: "wholesalehotelrates",
        pricePerNight,
        totalPrice,
        screenshotUrl,
        extractedData: {
          hotelName: params.hotelName,
          location: params.location,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
          nights,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error searching Wholesale Hotel Rates:", error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Search Hotels.com for pricing
 */
async function searchHotelsCom(
  params: HotelSearchParams
): Promise<PriceResult | null> {
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
    console.log("Searching Hotels.com...");
    await page.goto("https://www.hotels.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Fill search form
    const searchInput = await page.$('input[placeholder*="Where"], input[name="q"]');
    if (searchInput) {
      await searchInput.fill(params.location);
      await page.waitForTimeout(500);
    }

    // Fill dates
    const checkInInput = await page.$('input[placeholder*="Check-in"]');
    if (checkInInput) {
      await checkInInput.fill(params.checkInDate);
    }

    const checkOutInput = await page.$('input[placeholder*="Check-out"]');
    if (checkOutInput) {
      await checkOutInput.fill(params.checkOutDate);
    }

    // Submit search
    const searchButton = await page.$('button[type="submit"], button:has-text("Search")');
    if (searchButton) {
      await searchButton.click();
      await page.waitForTimeout(3000);
    }

    // Extract price
    const pricePerNight = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('[class*="price"], [data-price]');
      const priceArray = Array.from(priceElements);
      for (const el of priceArray) {
        const text = el.textContent || "";
        const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ""));
        }
      }
      return 0;
    });

    if (pricePerNight > 0) {
      const screenshotBuffer = await page.screenshot({ fullPage: true });
      const screenshotKey = `comparisons/${Date.now()}-hotels-com-${params.location}.png`;
      const { url: screenshotUrl } = await storagePut(
        screenshotKey,
        screenshotBuffer,
        "image/png"
      );

      const nights = calculateNights(params.checkInDate, params.checkOutDate);
      return {
        platform: "hotels.com",
        pricePerNight,
        totalPrice: pricePerNight * nights,
        screenshotUrl,
        extractedData: {
          hotelName: params.hotelName,
          location: params.location,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error searching Hotels.com:", error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Search Expedia for pricing
 */
async function searchExpedia(
  params: HotelSearchParams
): Promise<PriceResult | null> {
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
    console.log("Searching Expedia...");
    await page.goto("https://www.expedia.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Fill search form
    const searchInput = await page.$('input[placeholder*="Where"], input[name="query"]');
    if (searchInput) {
      await searchInput.fill(params.location);
      await page.waitForTimeout(500);
    }

    // Fill dates
    const checkInInput = await page.$('input[placeholder*="Check-in"]');
    if (checkInInput) {
      await checkInInput.fill(params.checkInDate);
    }

    const checkOutInput = await page.$('input[placeholder*="Check-out"]');
    if (checkOutInput) {
      await checkOutInput.fill(params.checkOutDate);
    }

    // Submit search
    const searchButton = await page.$('button[type="submit"], button:has-text("Search")');
    if (searchButton) {
      await searchButton.click();
      await page.waitForTimeout(3000);
    }

    // Extract price
    const pricePerNight = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('[class*="price"], [data-price]');
      const priceArray = Array.from(priceElements);
      for (const el of priceArray) {
        const text = el.textContent || "";
        const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ""));
        }
      }
      return 0;
    });

    if (pricePerNight > 0) {
      const screenshotBuffer = await page.screenshot({ fullPage: true });
      const screenshotKey = `comparisons/${Date.now()}-expedia-${params.location}.png`;
      const { url: screenshotUrl } = await storagePut(
        screenshotKey,
        screenshotBuffer,
        "image/png"
      );

      const nights = calculateNights(params.checkInDate, params.checkOutDate);
      return {
        platform: "expedia",
        pricePerNight,
        totalPrice: pricePerNight * nights,
        screenshotUrl,
        extractedData: {
          hotelName: params.hotelName,
          location: params.location,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error searching Expedia:", error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Search Booking.com for pricing
 */
async function searchBookingCom(
  params: HotelSearchParams
): Promise<PriceResult | null> {
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
    console.log("Searching Booking.com...");
    await page.goto("https://www.booking.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Fill search form
    const searchInput = await page.$('input[placeholder*="Where"], input[name="ss"]');
    if (searchInput) {
      await searchInput.fill(params.location);
      await page.waitForTimeout(500);
    }

    // Fill dates
    const checkInInput = await page.$('input[name="checkin"]');
    if (checkInInput) {
      await checkInInput.fill(params.checkInDate);
    }

    const checkOutInput = await page.$('input[name="checkout"]');
    if (checkOutInput) {
      await checkOutInput.fill(params.checkOutDate);
    }

    // Submit search
    const searchButton = await page.$('button[type="submit"], button:has-text("Search")');
    if (searchButton) {
      await searchButton.click();
      await page.waitForTimeout(3000);
    }

    // Extract price
    const pricePerNight = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('[class*="price"], [data-price]');
      const priceArray = Array.from(priceElements);
      for (const el of priceArray) {
        const text = el.textContent || "";
        const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ""));
        }
      }
      return 0;
    });

    if (pricePerNight > 0) {
      const screenshotBuffer = await page.screenshot({ fullPage: true });
      const screenshotKey = `comparisons/${Date.now()}-booking-${params.location}.png`;
      const { url: screenshotUrl } = await storagePut(
        screenshotKey,
        screenshotBuffer,
        "image/png"
      );

      const nights = calculateNights(params.checkInDate, params.checkOutDate);
      return {
        platform: "booking.com",
        pricePerNight,
        totalPrice: pricePerNight * nights,
        screenshotUrl,
        extractedData: {
          hotelName: params.hotelName,
          location: params.location,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error searching Booking.com:", error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Calculate number of nights between two dates
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate savings between wholesale and public prices
 */
function calculateSavings(wholesalePrice: number, publicPrice: number) {
  const savingsAmount = publicPrice - wholesalePrice;
  const savingsPercentage = (savingsAmount / publicPrice) * 100;
  const cashBackAmount = (wholesalePrice * 0.03); // 3% cash back
  
  return {
    savingsAmount: Math.round(savingsAmount * 100) / 100,
    savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    cashBackAmount: Math.round(cashBackAmount * 100) / 100,
  };
}

/**
 * Main function to run hotel comparison and store results
 */
export async function runHotelComparison(
  params?: Partial<HotelSearchParams>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  try {
    // Generate or use provided parameters
    const city = params?.location ? { name: params.location } : getRandomCity();
    const hotelChain = params?.hotelName ? params.hotelName : getRandomHotelChain();
    const dates = generateDates();
    
    const searchParams: HotelSearchParams = {
      hotelName: hotelChain,
      location: city.name,
      checkInDate: dates.checkIn,
      checkOutDate: dates.checkOut,
      starRating: params?.starRating || Math.floor(Math.random() * 2) + 4, // 4-5 stars
    };

    console.log(`\n🏨 Starting hotel comparison for ${searchParams.hotelName} in ${searchParams.location}`);
    console.log(`📅 Check-in: ${searchParams.checkInDate}, Check-out: ${searchParams.checkOutDate}\n`);

    // Create hotel comparison record
    const comparisonResult = await db.insert(hotelComparisons).values({
      hotelName: searchParams.hotelName,
      location: searchParams.location,
      checkInDate: searchParams.checkInDate,
      checkOutDate: searchParams.checkOutDate,
      starRating: searchParams.starRating,
      description: `${searchParams.starRating}-star hotel in ${searchParams.location}`,
    });

    const comparisonId = (comparisonResult as any).insertId;
    console.log(`✅ Created comparison record (ID: ${comparisonId})`);

    // Search Wholesale Hotel Rates
    console.log("\n🔍 Searching Wholesale Hotel Rates...");
    const whrResult = await searchWholesaleHotelRates(searchParams);

    let whrId: number | null = null;
    if (whrResult) {
      const whrInsert = await db.insert(priceData).values({
        comparisonId,
        platform: whrResult.platform,
        pricePerNight: whrResult.pricePerNight.toString(),
        totalPrice: whrResult.totalPrice.toString(),
        screenshotUrl: whrResult.screenshotUrl,
        extractedData: whrResult.extractedData,
      });
      whrId = (whrInsert as any).insertId;
      console.log(`✅ WHR Price: $${whrResult.pricePerNight}/night (Total: $${whrResult.totalPrice})`);
    } else {
      console.log("⚠️  Could not retrieve WHR pricing");
    }

    // Search public booking sites
    console.log("\n🔍 Searching public booking sites...");
    const publicResults: Array<PriceResult & { id: number }> = [];

    const hotelsComResult = await searchHotelsCom(searchParams);
    if (hotelsComResult) {
      const insert = await db.insert(priceData).values({
        comparisonId,
        platform: hotelsComResult.platform,
        pricePerNight: hotelsComResult.pricePerNight.toString(),
        totalPrice: hotelsComResult.totalPrice.toString(),
        screenshotUrl: hotelsComResult.screenshotUrl,
        extractedData: hotelsComResult.extractedData,
      });
      publicResults.push({
        ...hotelsComResult,
        id: (insert as any).insertId,
      });
      console.log(`✅ Hotels.com Price: $${hotelsComResult.pricePerNight}/night`);
    }

    const expediaResult = await searchExpedia(searchParams);
    if (expediaResult) {
      const insert = await db.insert(priceData).values({
        comparisonId,
        platform: expediaResult.platform,
        pricePerNight: expediaResult.pricePerNight.toString(),
        totalPrice: expediaResult.totalPrice.toString(),
        screenshotUrl: expediaResult.screenshotUrl,
        extractedData: expediaResult.extractedData,
      });
      publicResults.push({
        ...expediaResult,
        id: (insert as any).insertId,
      });
      console.log(`✅ Expedia Price: $${expediaResult.pricePerNight}/night`);
    }

    const bookingResult = await searchBookingCom(searchParams);
    if (bookingResult) {
      const insert = await db.insert(priceData).values({
        comparisonId,
        platform: bookingResult.platform,
        pricePerNight: bookingResult.pricePerNight.toString(),
        totalPrice: bookingResult.totalPrice.toString(),
        screenshotUrl: bookingResult.screenshotUrl,
        extractedData: bookingResult.extractedData,
      });
      publicResults.push({
        ...bookingResult,
        id: (insert as any).insertId,
      });
      console.log(`✅ Booking.com Price: $${bookingResult.pricePerNight}/night`);
    }

    // Calculate and store savings
    if (whrResult && publicResults.length > 0) {
      console.log("\n💰 Calculating savings...");
      for (const publicResult of publicResults) {
        const savings = calculateSavings(whrResult.totalPrice, publicResult.totalPrice);
        
        await db.insert(comparisonResults).values({
          comparisonId,
          wholesaleHotelRatesId: whrId,
          publicPlatformId: publicResult.id,
          savingsAmount: savings.savingsAmount.toString(),
          savingsPercentage: savings.savingsPercentage.toString(),
          cashBackAmount: savings.cashBackAmount.toString(),
        });

        console.log(`✅ vs ${publicResult.platform}: Save $${savings.savingsAmount} (${savings.savingsPercentage}%)`);
      }
    }

    console.log("\n✨ Hotel comparison completed successfully!\n");
  } catch (error) {
    console.error("Error running hotel comparison:", error);
  }
}

/**
 * Run multiple hotel comparisons for demo purposes
 */
export async function runMultipleComparisons(count: number = 3): Promise<void> {
  console.log(`\n🚀 Running ${count} hotel comparisons...\n`);
  
  for (let i = 0; i < count; i++) {
    console.log(`\n--- Comparison ${i + 1} of ${count} ---`);
    await runHotelComparison();
    
    // Add delay between requests to avoid rate limiting
    if (i < count - 1) {
      console.log("⏳ Waiting before next comparison...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log("\n✨ All comparisons completed!");
}
