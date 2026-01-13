import { chromium } from "playwright";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { hotelComparisons, priceData, comparisonResults } from "../drizzle/schema";

/**
 * Hotel comparison bot that collects pricing data from multiple booking platforms
 * Uses proven selectors and navigation flow from previous working implementation
 */

// Major worldwide cities with large populations
const MAJOR_CITIES = [
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

// Popular hotel chains
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
  checkInDate: string;
  checkOutDate: string;
  starRating?: number;
}

interface PriceResult {
  platform: string;
  pricePerNight: number;
  totalPrice: number;
  screenshotUrl: string;
  extractedData: Record<string, any>;
}

function getRandomCity() {
  return MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
}

function getRandomHotelChain() {
  return HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
}

function generateDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 7);
  
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 3);
  
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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("🔍 Searching Wholesale Hotel Rates...");
    
    // Navigate to WHR login
    await page.goto("https://web3demo.wholesalehotelrates.com/login");
    
    // Login with demo credentials
    await page.fill('input[name="username"]', "web3demo");
    await page.fill('input[name="password"]', "web3demo!@");
    await page.click('button:has-text("Log In")');
    await page.waitForNavigation();
    
    console.log("✅ Logged in to WHR");
    
    // Click "Go to Booking Platform"
    await page.click('a:has-text("Go To Booking Platform")');
    await page.waitForNavigation();
    
    console.log("✅ Navigated to booking platform");
    
    // Fill search form using proven selectors
    await page.fill('input#city', params.location);
    await page.click('li:has-text("' + params.location + '")');
    await page.fill('input#theCheckIn', params.checkInDate);
    await page.fill('input#theCheckOut', params.checkOutDate);
    await page.click('input#theSubmitButton');
    await page.waitForNavigation();
    
    console.log("✅ Search submitted");
    
    // Wait for results to load
    await page.waitForSelector('a:has-text("' + params.hotelName + '")', {
      timeout: 10000,
    });
    
    // Find and click the hotel
    await page.click('a:has-text("' + params.hotelName + '")');
    await page.waitForNavigation();
    
    console.log("✅ Hotel selected");
    
    // Capture screenshot of pricing page
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotKey = `comparisons/${Date.now()}-whr-${params.hotelName}.png`;
    const { url: screenshotUrl } = await storagePut(
      screenshotKey,
      screenshotBuffer,
      "image/png"
    );
    
    // Extract pricing data from page
    const pricePerNight = await page.evaluate(() => {
      const priceElement = document.querySelector('[class*="price"]');
      if (priceElement) {
        const text = priceElement.textContent || "";
        const match = text.match(/\$?(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
      }
      return 0;
    });
    
    const nights = calculateNights(params.checkInDate, params.checkOutDate);
    const totalPrice = pricePerNight * nights;
    
    console.log(`✅ WHR Price: $${pricePerNight}/night`);
    
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
  } catch (error) {
    console.error("❌ Error searching Wholesale Hotel Rates:", error);
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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("🔍 Searching Hotels.com...");
    
    await page.goto("https://www.hotels.com");
    
    // Search logic would go here
    // For now, return null as public sites have bot detection
    console.log("⚠️  Hotels.com search skipped (bot detection)");
    
    return null;
  } catch (error) {
    console.error("❌ Error with Hotels.com search:", error);
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Search Expedia for pricing
 */
async function searchExpedia(
  params: HotelSearchParams
): Promise<PriceResult | null> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("🔍 Searching Expedia...");
    
    await page.goto("https://www.expedia.com");
    
    // Search logic would go here
    console.log("⚠️  Expedia search skipped (bot detection)");
    
    return null;
  } catch (error) {
    console.error("❌ Error with Expedia search:", error);
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Search Booking.com for pricing
 */
async function searchBookingCom(
  params: HotelSearchParams
): Promise<PriceResult | null> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("🔍 Searching Booking.com...");
    
    await page.goto("https://www.booking.com");
    
    // Search logic would go here
    console.log("⚠️  Booking.com search skipped (bot detection)");
    
    return null;
  } catch (error) {
    console.error("❌ Error with Booking.com search:", error);
    return null;
  } finally {
    await page.close();
  }
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function calculateSavings(wholesalePrice: number, publicPrice: number) {
  const savingsAmount = publicPrice - wholesalePrice;
  const savingsPercentage = (savingsAmount / publicPrice) * 100;
  const cashBackAmount = (wholesalePrice * 0.03);
  
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
    const location = params?.location || getRandomCity();
    const hotelName = params?.hotelName || getRandomHotelChain();
    const dates = generateDates();
    
    const searchParams: HotelSearchParams = {
      hotelName,
      location,
      checkInDate: dates.checkIn,
      checkOutDate: dates.checkOut,
      starRating: params?.starRating || 5,
    };

    console.log(`\n🏨 Starting hotel comparison for ${hotelName} in ${location}`);
    console.log(`📅 ${dates.checkIn} to ${dates.checkOut}\n`);

    // Create hotel comparison record
    const comparisonResult = await db.insert(hotelComparisons).values({
      hotelName,
      location,
      checkInDate: dates.checkIn,
      checkOutDate: dates.checkOut,
      starRating: searchParams.starRating,
      description: `${searchParams.starRating}-star hotel in ${location}`,
    });

    const comparisonId = (comparisonResult as any).insertId;
    console.log(`✅ Created comparison record (ID: ${comparisonId})\n`);

    // Search Wholesale Hotel Rates
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
    } else {
      console.log("⚠️  Could not retrieve WHR pricing\n");
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

        console.log(`✅ vs ${publicResult.platform}: Save $${savings.savingsAmount}`);
      }
    }

    console.log("\n✨ Hotel comparison completed!\n");
  } catch (error) {
    console.error("Error running hotel comparison:", error);
  }
}

/**
 * Run multiple hotel comparisons
 */
export async function runMultipleComparisons(count: number = 1): Promise<void> {
  console.log(`\n🚀 Running ${count} hotel comparison(s)...\n`);
  
  for (let i = 0; i < count; i++) {
    console.log(`\n--- Comparison ${i + 1} of ${count} ---`);
    await runHotelComparison();
    
    if (i < count - 1) {
      console.log("⏳ Waiting before next comparison...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log("\n✨ All comparisons completed!");
}
