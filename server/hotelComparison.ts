import { chromium } from "playwright";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { hotelComparisons, priceData, comparisonResults } from "../drizzle/schema";

/**
 * Hotel comparison bot that collects pricing data and screenshots
 * from multiple booking platforms before the presentation
 */

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
 * Search Wholesale Hotel Rates and capture pricing
 */
async function searchWholesaleHotelRates(
  params: HotelSearchParams
): Promise<PriceResult | null> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to WHR login
    await page.goto("https://web3demo.wholesalehotelrates.com/login");

    // Login with demo credentials
    await page.fill('input[name="username"]', "web3demo");
    await page.fill('input[name="password"]', "web3demo!@");
    await page.click('button:has-text("Log In")');
    await page.waitForNavigation();

    // Click "Go to Booking Platform"
    await page.click('a:has-text("Go To Booking Platform")');
    await page.waitForNavigation();

    // Fill search form
    await page.fill('input#city', params.location);
    await page.click('li:has-text("' + params.location + '")');
    await page.fill('input#theCheckIn', params.checkInDate);
    await page.fill('input#theCheckOut', params.checkOutDate);
    await page.click('input#theSubmitButton');
    await page.waitForNavigation();

    // Wait for results to load
    await page.waitForSelector('a:has-text("' + params.hotelName + '")', {
      timeout: 10000,
    });

    // Find and click the hotel
    await page.click('a:has-text("' + params.hotelName + '")');
    await page.waitForNavigation();

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
    console.error("Error searching Wholesale Hotel Rates:", error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Search public booking sites (hotels.com, Expedia, Booking.com)
 * Note: These may have bot detection, so we use a more cautious approach
 */
async function searchPublicBookingSites(
  params: HotelSearchParams
): Promise<PriceResult[]> {
  const results: PriceResult[] = [];
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    // Try hotels.com
    const hotelsComResult = await searchHotelsCom(browser, params);
    if (hotelsComResult) results.push(hotelsComResult);

    // Try Expedia
    const expediaResult = await searchExpedia(browser, params);
    if (expediaResult) results.push(expediaResult);

    // Try Booking.com
    const bookingResult = await searchBookingCom(browser, params);
    if (bookingResult) results.push(bookingResult);
  } catch (error) {
    console.error("Error searching public booking sites:", error);
  } finally {
    await browser.close();
  }

  return results;
}

async function searchHotelsCom(
  browser: any,
  params: HotelSearchParams
): Promise<PriceResult | null> {
  const page = await browser.newPage();
  try {
    await page.goto("https://www.hotels.com");
    // Add search logic here
    // This is a placeholder - actual implementation would handle bot detection
    return null;
  } catch (error) {
    console.error("Error with hotels.com search:", error);
    return null;
  } finally {
    await page.close();
  }
}

async function searchExpedia(
  browser: any,
  params: HotelSearchParams
): Promise<PriceResult | null> {
  const page = await browser.newPage();
  try {
    await page.goto("https://www.expedia.com");
    // Add search logic here
    return null;
  } catch (error) {
    console.error("Error with Expedia search:", error);
    return null;
  } finally {
    await page.close();
  }
}

async function searchBookingCom(
  browser: any,
  params: HotelSearchParams
): Promise<PriceResult | null> {
  const page = await browser.newPage();
  try {
    await page.goto("https://www.booking.com");
    // Add search logic here
    return null;
  } catch (error) {
    console.error("Error with Booking.com search:", error);
    return null;
  } finally {
    await page.close();
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
 * Main function to run hotel comparison and store results
 */
export async function runHotelComparison(
  params: HotelSearchParams
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  try {
    // Create hotel comparison record
    const comparisonResult = await db.insert(hotelComparisons).values({
      hotelName: params.hotelName,
      location: params.location,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      starRating: params.starRating,
    });

    const comparisonId = (comparisonResult as any).insertId;

    // Search Wholesale Hotel Rates
    console.log("Searching Wholesale Hotel Rates...");
    const whrResult = await searchWholesaleHotelRates(params);

    if (whrResult) {
      await db.insert(priceData).values({
        comparisonId,
        platform: whrResult.platform,
        pricePerNight: whrResult.pricePerNight.toString(),
        totalPrice: whrResult.totalPrice.toString(),
        screenshotUrl: whrResult.screenshotUrl,
        extractedData: whrResult.extractedData,
      });
    }

    // Search public booking sites
    console.log("Searching public booking sites...");
    const publicResults = await searchPublicBookingSites(params);

    for (const result of publicResults) {
      await db.insert(priceData).values({
        comparisonId,
        platform: result.platform,
        pricePerNight: result.pricePerNight.toString(),
        totalPrice: result.totalPrice.toString(),
        screenshotUrl: result.screenshotUrl,
        extractedData: result.extractedData,
      });
    }

    console.log("Hotel comparison completed successfully");
  } catch (error) {
    console.error("Error running hotel comparison:", error);
  }
}
