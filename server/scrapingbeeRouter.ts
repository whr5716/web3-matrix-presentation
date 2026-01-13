import { router, publicProcedure } from "./_core/trpc";
import axios from "axios";
import { z } from "zod";

const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY || "5CUTAHCPP82DDUIBD9B04RSH8IEQY6FDBL7XKAJCFIHIR0W6RYWPZ5EYLMDR9Q6KSDN1G51CLZIPZ9OL";
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

interface HotelComparisonResult {
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
  screenshotUrls: {
    hotelscom?: string | undefined;
    expedia?: string | undefined;
    booking?: string | undefined;
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
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 7);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 3);

  return {
    checkIn: checkIn.toISOString().split("T")[0],
    checkOut: checkOut.toISOString().split("T")[0],
    nights: Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
  };
}

async function scrapeWithScrapingBee(
  url: string,
  extractorRules?: string
): Promise<{
  success: boolean;
  html?: string;
  screenshot?: string;
  data?: any;
  error?: string;
}> {
  try {
    const params: any = {
      api_key: SCRAPINGBEE_API_KEY,
      url: url,
      render_javascript: "true",
      wait_for: "body",
      screenshot: "true",
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
    return {
      success: false,
      error: error.message,
    };
  }
}

async function scrapeHotelsComPrice(city: string, hotel: string, checkIn: string, checkOut: string) {
  const searchUrl = `https://www.hotels.com/search.do?q-location=${encodeURIComponent(city)}&q-check-in=${checkIn}&q-check-out=${checkOut}`;

  const extractorRules = JSON.stringify({
    prices: {
      selector: ".uitk-price-lockup__price, [data-testid*='price'], .price-lockup",
      type: "list",
      output: "text",
    },
  });

  const result = await scrapeWithScrapingBee(searchUrl, extractorRules);

  if (result.success && result.data?.prices?.length > 0) {
    const priceText = result.data.prices[0];
    const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      return {
        price,
        screenshot: result.screenshot,
        success: true,
      };
    }
  }

  return {
    price: null,
    screenshot: null,
    success: false,
  };
}

async function scrapeExpediaPrice(city: string, hotel: string, checkIn: string, checkOut: string) {
  const searchUrl = `https://www.expedia.com/Hotel-Search?location=${encodeURIComponent(city)}&startDate=${checkIn}&endDate=${checkOut}`;

  const extractorRules = JSON.stringify({
    prices: {
      selector: ".uitk-price-lockup__price, [data-testid*='price'], .price",
      type: "list",
      output: "text",
    },
  });

  const result = await scrapeWithScrapingBee(searchUrl, extractorRules);

  if (result.success && result.data?.prices?.length > 0) {
    const priceText = result.data.prices[0];
    const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      return {
        price,
        screenshot: result.screenshot,
        success: true,
      };
    }
  }

  return {
    price: null,
    screenshot: null,
    success: false,
  };
}

async function scrapeBookingComPrice(city: string, hotel: string, checkIn: string, checkOut: string) {
  const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}`;

  const extractorRules = JSON.stringify({
    prices: {
      selector: ".price, [data-testid*='price'], .bui-price-display__value",
      type: "list",
      output: "text",
    },
  });

  const result = await scrapeWithScrapingBee(searchUrl, extractorRules);

  if (result.success && result.data?.prices?.length > 0) {
    const priceText = result.data.prices[0];
    const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      return {
        price,
        screenshot: result.screenshot,
        success: true,
      };
    }
  }

  return {
    price: null,
    screenshot: null,
    success: false,
  };
}

export const scrapingbeeRouter = router({
  runComparison: publicProcedure
  .input(
    z.object({
      city: z.string().optional(),
      hotel: z.string().optional(),
    })
  )
  .mutation(async ({ input }: { input: { city?: string; hotel?: string } }): Promise<HotelComparisonResult> => {
      const city = input.city
        ? MAJOR_CITIES.find((c) => c.name.toLowerCase() === input.city?.toLowerCase()) || getRandomCity()
        : getRandomCity();

      const hotel = input.hotel || getRandomHotel();
      const dates = generateDates();

      console.log(`🤖 Running hotel comparison for ${hotel} in ${city.name}`);

      // Scrape all three sites in parallel
      const [hotelsComResult, expediaResult, bookingResult] = await Promise.all([
        scrapeHotelsComPrice(city.name, hotel, dates.checkIn, dates.checkOut),
        scrapeExpediaPrice(city.name, hotel, dates.checkIn, dates.checkOut),
        scrapeBookingComPrice(city.name, hotel, dates.checkIn, dates.checkOut),
      ]);

      // Calculate savings
      const publicPrices = [hotelsComResult.price, expediaResult.price, bookingResult.price].filter(
        (p) => p !== null
      ) as number[];

      let whrPrice = null;
      let savings = null;

      if (publicPrices.length > 0) {
        const avgPublicPrice = publicPrices.reduce((a, b) => a + b, 0) / publicPrices.length;
        // Assume WHR price is 15-20% lower (typical wholesale discount)
        whrPrice = avgPublicPrice * 0.85;
        savings = avgPublicPrice - whrPrice;
      }

      return {
        city: city.name,
        country: city.country,
        hotel,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        nights: dates.nights,
        whrPrice,
        hotelsComPrice: hotelsComResult.price,
        expediaPrice: expediaResult.price,
        bookingPrice: bookingResult.price,
        savings,
        screenshotUrls: {
          hotelscom: hotelsComResult.screenshot || undefined,
          expedia: expediaResult.screenshot || undefined,
          booking: bookingResult.screenshot || undefined,
        },
      };
    }),

  getRandomCity: publicProcedure.query(() => {
    return getRandomCity();
  }),

  getAllCities: publicProcedure.query(() => {
    return MAJOR_CITIES;
  }),

  getHotelChains: publicProcedure.query(() => {
    return HOTEL_CHAINS;
  }),
});
