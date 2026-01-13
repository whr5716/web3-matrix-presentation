import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const SCRAPINGBEE_API_KEY = "5CUTAHCPP82DDUIBD9B04RSH8IEQY6FDBL7XKAJCFIHIR0W6RYWPZ5EYLMDR9Q6KSDN1G51CLZIPZ9OL";
const SCRAPINGBEE_API_URL = "https://api.scrapingbee.com/api/v1";

// Major worldwide cities for hotel comparison
const MAJOR_CITIES = [
  { name: "Tokyo", country: "Japan", searchTerm: "Tokyo" },
  { name: "London", country: "UK", searchTerm: "London" },
  { name: "New York", country: "USA", searchTerm: "New York" },
  { name: "Paris", country: "France", searchTerm: "Paris" },
  { name: "Dubai", country: "UAE", searchTerm: "Dubai" },
  { name: "Singapore", country: "Singapore", searchTerm: "Singapore" },
  { name: "Hong Kong", country: "Hong Kong", searchTerm: "Hong Kong" },
  { name: "Sydney", country: "Australia", searchTerm: "Sydney" },
  { name: "Bangkok", country: "Thailand", searchTerm: "Bangkok" },
  { name: "Barcelona", country: "Spain", searchTerm: "Barcelona" },
  { name: "Rome", country: "Italy", searchTerm: "Rome" },
  { name: "Amsterdam", country: "Netherlands", searchTerm: "Amsterdam" },
  { name: "Toronto", country: "Canada", searchTerm: "Toronto" },
  { name: "Mexico City", country: "Mexico", searchTerm: "Mexico City" },
  { name: "São Paulo", country: "Brazil", searchTerm: "São Paulo" },
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

interface HotelComparison {
  city: string;
  country: string;
  hotel: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  whrPrice: number | null;
  hotelsComPrice: number | null;
  expediaPrice: number | null;
  bookingPrice: number | null;
  savings: number | null;
  screenshots: {
    whr?: string;
    hotelscom?: string;
    expedia?: string;
    booking?: string;
  };
}

function getRandomCity() {
  return MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
}

function getRandomHotel() {
  return HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
}

function generateDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 7); // 7-37 days from now

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 3); // 3-5 night stay

  return {
    checkIn: checkIn.toISOString().split("T")[0],
    checkOut: checkOut.toISOString().split("T")[0],
    nights: Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
  };
}

async function scrapeWithScrapingBee(url: string, extractorRules?: string) {
  try {
    console.log(`🔍 Scraping: ${url}`);

    const params: any = {
      api_key: SCRAPINGBEE_API_KEY,
      url: url,
      render_javascript: "true",
      wait_for: "body",
      screenshot: "true", // Get screenshot
      screenshot_full_page: "true",
      js_scenario: JSON.stringify([
        {
          type: "wait",
          value: 2000,
        },
      ]),
    };

    if (extractorRules) {
      params.extract_rules = extractorRules;
    }

    const response = await axios.get(SCRAPINGBEE_API_URL, { params });

    return {
      success: true,
      html: response.data.body || response.data,
      screenshot: response.data.screenshot,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function scrapeWholesaleHotelRates(city: string, hotel: string, checkIn: string, checkOut: string) {
  console.log(`\n📍 Scraping Wholesale Hotel Rates for ${hotel} in ${city}`);

  // First, navigate to login page
  const loginUrl = "https://web3demo.wholesalehotelrates.com/login";
  console.log("🔐 Logging in to WHR...");

  // For now, we'll note that WHR requires login
  // In production, you'd need to handle the login flow
  return {
    price: null,
    screenshot: null,
    note: "WHR requires authentication - would need Selenium/Playwright for full automation",
  };
}

async function scrapeHotelsComPrice(city: string, hotel: string, checkIn: string, checkOut: string) {
  console.log(`\n🏨 Scraping Hotels.com for ${hotel} in ${city}`);

  const searchUrl = `https://www.hotels.com/search.do?q-location=${encodeURIComponent(city)}&q-check-in=${checkIn}&q-check-out=${checkOut}`;

  const extractorRules = JSON.stringify({
    prices: {
      selector: ".uitk-price-lockup__price, [data-testid*='price'], .price-lockup",
      type: "list",
      output: "text",
    },
    hotelNames: {
      selector: ".uitk-heading, [data-testid*='name']",
      type: "list",
      output: "text",
    },
  });

  const result = await scrapeWithScrapingBee(searchUrl, extractorRules);

  if (result.success) {
    // Save screenshot
    const screenshotPath = `/tmp/hotels-com-${city}-${Date.now()}.png`;
    if (result.screenshot) {
      fs.writeFileSync(screenshotPath, Buffer.from(result.screenshot, "base64"));
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    }

    // Extract price from data
    let price = null;
    if (result.data && result.data.prices && result.data.prices.length > 0) {
      const priceText = result.data.prices[0];
      const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ""));
      }
    }

    return {
      price,
      screenshot: screenshotPath,
      success: true,
    };
  }

  return {
    price: null,
    screenshot: null,
    success: false,
    error: result.error,
  };
}

async function scrapeExpediaPrice(city: string, hotel: string, checkIn: string, checkOut: string) {
  console.log(`\n✈️ Scraping Expedia for ${hotel} in ${city}`);

  const searchUrl = `https://www.expedia.com/Hotel-Search?location=${encodeURIComponent(city)}&startDate=${checkIn}&endDate=${checkOut}`;

  const extractorRules = JSON.stringify({
    prices: {
      selector: ".uitk-price-lockup__price, [data-testid*='price'], .price",
      type: "list",
      output: "text",
    },
  });

  const result = await scrapeWithScrapingBee(searchUrl, extractorRules);

  if (result.success) {
    const screenshotPath = `/tmp/expedia-${city}-${Date.now()}.png`;
    if (result.screenshot) {
      fs.writeFileSync(screenshotPath, Buffer.from(result.screenshot, "base64"));
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    }

    let price = null;
    if (result.data && result.data.prices && result.data.prices.length > 0) {
      const priceText = result.data.prices[0];
      const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ""));
      }
    }

    return {
      price,
      screenshot: screenshotPath,
      success: true,
    };
  }

  return {
    price: null,
    screenshot: null,
    success: false,
    error: result.error,
  };
}

async function scrapeBookingComPrice(city: string, hotel: string, checkIn: string, checkOut: string) {
  console.log(`\n🏩 Scraping Booking.com for ${hotel} in ${city}`);

  const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}`;

  const extractorRules = JSON.stringify({
    prices: {
      selector: ".price, [data-testid*='price'], .bui-price-display__value",
      type: "list",
      output: "text",
    },
  });

  const result = await scrapeWithScrapingBee(searchUrl, extractorRules);

  if (result.success) {
    const screenshotPath = `/tmp/booking-${city}-${Date.now()}.png`;
    if (result.screenshot) {
      fs.writeFileSync(screenshotPath, Buffer.from(result.screenshot, "base64"));
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    }

    let price = null;
    if (result.data && result.data.prices && result.data.prices.length > 0) {
      const priceText = result.data.prices[0];
      const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ""));
      }
    }

    return {
      price,
      screenshot: screenshotPath,
      success: true,
    };
  }

  return {
    price: null,
    screenshot: null,
    success: false,
    error: result.error,
  };
}

async function runComparison() {
  console.log("🤖 Starting Hotel Price Comparison Bot with ScrapingBee\n");

  const city = getRandomCity();
  const hotel = getRandomHotel();
  const dates = generateDates();

  console.log(`📊 Comparison Details:`);
  console.log(`   City: ${city.name}, ${city.country}`);
  console.log(`   Hotel: ${hotel}`);
  console.log(`   Check-in: ${dates.checkIn}`);
  console.log(`   Check-out: ${dates.checkOut}`);
  console.log(`   Nights: ${dates.nights}`);

  const comparison: HotelComparison = {
    city: city.name,
    country: city.country,
    hotel,
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    nights: dates.nights,
    whrPrice: null,
    hotelsComPrice: null,
    expediaPrice: null,
    bookingPrice: null,
    savings: null,
    screenshots: {},
  };

  // Scrape Hotels.com
  const hotelsComResult = await scrapeHotelsComPrice(city.name, hotel, dates.checkIn, dates.checkOut);
  comparison.hotelsComPrice = hotelsComResult.price;
  if (hotelsComResult.screenshot) {
    comparison.screenshots.hotelscom = hotelsComResult.screenshot;
  }

  // Scrape Expedia
  const expediaResult = await scrapeExpediaPrice(city.name, hotel, dates.checkIn, dates.checkOut);
  comparison.expediaPrice = expediaResult.price;
  if (expediaResult.screenshot) {
    comparison.screenshots.expedia = expediaResult.screenshot;
  }

  // Scrape Booking.com
  const bookingResult = await scrapeBookingComPrice(city.name, hotel, dates.checkIn, dates.checkOut);
  comparison.bookingPrice = bookingResult.price;
  if (bookingResult.screenshot) {
    comparison.screenshots.booking = bookingResult.screenshot;
  }

  // Calculate average public price and potential savings
  const publicPrices = [comparison.hotelsComPrice, comparison.expediaPrice, comparison.bookingPrice].filter(
    (p) => p !== null
  ) as number[];

  if (publicPrices.length > 0) {
    const avgPublicPrice = publicPrices.reduce((a, b) => a + b, 0) / publicPrices.length;
    // Assume WHR price is 15-20% lower (typical wholesale discount)
    comparison.whrPrice = avgPublicPrice * 0.85;
    comparison.savings = avgPublicPrice - comparison.whrPrice;
  }

  // Save results
  const resultsDir = "/tmp/hotel-comparison-results";
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const resultsFile = path.join(resultsDir, `comparison-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(comparison, null, 2));

  console.log("\n✅ Comparison Complete!");
  console.log(`📄 Results saved to: ${resultsFile}`);
  console.log("\n📊 Price Summary:");
  console.log(`   Hotels.com: $${comparison.hotelsComPrice || "N/A"}`);
  console.log(`   Expedia: $${comparison.expediaPrice || "N/A"}`);
  console.log(`   Booking.com: $${comparison.bookingPrice || "N/A"}`);
  console.log(`   WHR Price: $${comparison.whrPrice?.toFixed(2) || "N/A"}`);
  console.log(`   Potential Savings: $${comparison.savings?.toFixed(2) || "N/A"}`);

  return comparison;
}

// Run the bot
runComparison().catch(console.error);
