import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { hotelComparisons, priceData, comparisonResults } from "./drizzle/schema.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Major worldwide cities with realistic hotel pricing
const GLOBAL_HOTELS = [
  {
    hotelName: "Park Hyatt Tokyo",
    location: "Tokyo, Japan",
    checkInDate: "2025-03-15",
    checkOutDate: "2025-03-18",
    starRating: 5,
    wholesalePrice: 450,
    publicPrices: { "hotels.com": 650, "expedia": 680, "booking.com": 670 },
  },
  {
    hotelName: "The Savoy London",
    location: "London, United Kingdom",
    checkInDate: "2025-04-10",
    checkOutDate: "2025-04-13",
    starRating: 5,
    wholesalePrice: 520,
    publicPrices: { "hotels.com": 750, "expedia": 780, "booking.com": 760 },
  },
  {
    hotelName: "The Plaza New York",
    location: "New York, United States",
    checkInDate: "2025-03-20",
    checkOutDate: "2025-03-23",
    starRating: 5,
    wholesalePrice: 480,
    publicPrices: { "hotels.com": 720, "expedia": 750, "booking.com": 740 },
  },
  {
    hotelName: "Four Seasons Hotel Paris",
    location: "Paris, France",
    checkInDate: "2025-04-05",
    checkOutDate: "2025-04-08",
    starRating: 5,
    wholesalePrice: 490,
    publicPrices: { "hotels.com": 710, "expedia": 740, "booking.com": 730 },
  },
  {
    hotelName: "Burj Al Arab Jumeirah",
    location: "Dubai, United Arab Emirates",
    checkInDate: "2025-03-25",
    checkOutDate: "2025-03-28",
    starRating: 5,
    wholesalePrice: 550,
    publicPrices: { "hotels.com": 850, "expedia": 880, "booking.com": 870 },
  },
  {
    hotelName: "Marina Bay Sands",
    location: "Singapore, Singapore",
    checkInDate: "2025-04-01",
    checkOutDate: "2025-04-04",
    starRating: 5,
    wholesalePrice: 420,
    publicPrices: { "hotels.com": 620, "expedia": 650, "booking.com": 640 },
  },
  {
    hotelName: "The Peninsula Hong Kong",
    location: "Hong Kong, Hong Kong",
    checkInDate: "2025-03-10",
    checkOutDate: "2025-03-13",
    starRating: 5,
    wholesalePrice: 440,
    publicPrices: { "hotels.com": 640, "expedia": 670, "booking.com": 660 },
  },
  {
    hotelName: "Park Hyatt Sydney",
    location: "Sydney, Australia",
    checkInDate: "2025-04-15",
    checkOutDate: "2025-04-18",
    starRating: 5,
    wholesalePrice: 380,
    publicPrices: { "hotels.com": 580, "expedia": 610, "booking.com": 600 },
  },
  {
    hotelName: "Mandarin Oriental Bangkok",
    location: "Bangkok, Thailand",
    checkInDate: "2025-03-30",
    checkOutDate: "2025-04-02",
    starRating: 5,
    wholesalePrice: 320,
    publicPrices: { "hotels.com": 480, "expedia": 510, "booking.com": 500 },
  },
  {
    hotelName: "Mercer Barcelona",
    location: "Barcelona, Spain",
    checkInDate: "2025-04-20",
    checkOutDate: "2025-04-23",
    starRating: 5,
    wholesalePrice: 350,
    publicPrices: { "hotels.com": 530, "expedia": 560, "booking.com": 550 },
  },
  {
    hotelName: "Hotel Eden Rome",
    location: "Rome, Italy",
    checkInDate: "2025-04-08",
    checkOutDate: "2025-04-11",
    starRating: 5,
    wholesalePrice: 380,
    publicPrices: { "hotels.com": 570, "expedia": 600, "booking.com": 590 },
  },
  {
    hotelName: "Pulitzer Amsterdam",
    location: "Amsterdam, Netherlands",
    checkInDate: "2025-04-12",
    checkOutDate: "2025-04-15",
    starRating: 5,
    wholesalePrice: 340,
    publicPrices: { "hotels.com": 520, "expedia": 550, "booking.com": 540 },
  },
  {
    hotelName: "The Fairmont Royal York Toronto",
    location: "Toronto, Canada",
    checkInDate: "2025-03-22",
    checkOutDate: "2025-03-25",
    starRating: 5,
    wholesalePrice: 300,
    publicPrices: { "hotels.com": 450, "expedia": 480, "booking.com": 470 },
  },
  {
    hotelName: "Gran Hotel Ciudad de México",
    location: "Mexico City, Mexico",
    checkInDate: "2025-04-03",
    checkOutDate: "2025-04-06",
    starRating: 5,
    wholesalePrice: 280,
    publicPrices: { "hotels.com": 420, "expedia": 450, "booking.com": 440 },
  },
  {
    hotelName: "Emiliano São Paulo",
    location: "São Paulo, Brazil",
    checkInDate: "2025-03-28",
    checkOutDate: "2025-03-31",
    starRating: 5,
    wholesalePrice: 290,
    publicPrices: { "hotels.com": 440, "expedia": 470, "booking.com": 460 },
  },
];

async function seedGlobalHotels() {
  try {
    // Parse the database URL
    const url = new URL(databaseUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
    });

    const db = drizzle(connection);

    // Clear existing data
    console.log("🗑️  Clearing existing hotel comparison data...");
    await connection.query("DELETE FROM comparisonResults");
    await connection.query("DELETE FROM priceData");
    await connection.query("DELETE FROM hotelComparisons");

    console.log("\n🌍 Seeding global hotel comparison data...\n");

    let totalComparisons = 0;
    let totalSavings = 0;

    for (const hotel of GLOBAL_HOTELS) {
      console.log(`📍 ${hotel.location} - ${hotel.hotelName}`);

      // Create hotel comparison record
      const comparisonResult = await db.insert(hotelComparisons).values({
        hotelName: hotel.hotelName,
        location: hotel.location,
        checkInDate: hotel.checkInDate,
        checkOutDate: hotel.checkOutDate,
        starRating: hotel.starRating,
        description: `${hotel.starRating}-star luxury hotel in ${hotel.location}`,
      });

      const comparisonId = (comparisonResult as any).insertId;

      // Calculate nights
      const checkIn = new Date(hotel.checkInDate);
      const checkOut = new Date(hotel.checkOutDate);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Insert Wholesale Hotel Rates price
      const whrTotalPrice = hotel.wholesalePrice * nights;
      const whrInsert = await db.insert(priceData).values({
        comparisonId,
        platform: "wholesalehotelrates",
        pricePerNight: hotel.wholesalePrice.toString(),
        totalPrice: whrTotalPrice.toString(),
        screenshotUrl: `/demo/whr-${hotel.location.replace(/,\s*/g, "-")}.png`,
        extractedData: {
          hotelName: hotel.hotelName,
          location: hotel.location,
          nights,
        },
      });

      const whrId = (whrInsert as any).insertId;

      // Insert public booking site prices and calculate savings
      for (const [platform, pricePerNight] of Object.entries(
        hotel.publicPrices
      )) {
        const totalPrice = pricePerNight * nights;

        const publicInsert = await db.insert(priceData).values({
          comparisonId,
          platform,
          pricePerNight: pricePerNight.toString(),
          totalPrice: totalPrice.toString(),
          screenshotUrl: `/demo/${platform}-${hotel.location.replace(/,\s*/g, "-")}.png`,
          extractedData: {
            hotelName: hotel.hotelName,
            location: hotel.location,
          },
        });

        const publicId = (publicInsert as any).insertId;

        // Calculate savings
        const savingsAmount = totalPrice - whrTotalPrice;
        const savingsPercentage = (savingsAmount / totalPrice) * 100;
        const cashBackAmount = (whrTotalPrice * 0.03); // 3% cash back

        await db.insert(comparisonResults).values({
          comparisonId,
          wholesaleHotelRatesId: whrId,
          publicPlatformId: publicId,
          savingsAmount: savingsAmount.toString(),
          savingsPercentage: savingsPercentage.toString(),
          cashBackAmount: cashBackAmount.toString(),
        });

        console.log(
          `  ✅ ${platform}: $${pricePerNight}/night (Total: $${totalPrice}) - Save $${Math.round(savingsAmount)} (${Math.round(savingsPercentage)}%)`
        );

        totalSavings += savingsAmount;
      }

      totalComparisons++;
      console.log();
    }

    console.log("✨ Global hotel data seeded successfully!");
    console.log(`📊 Total: ${totalComparisons} hotels across 15 major cities`);
    console.log(`💰 Total potential savings: $${Math.round(totalSavings)}`);
    console.log();

    await connection.end();
  } catch (error) {
    console.error("❌ Error seeding global hotel data:", error);
    process.exit(1);
  }
}

seedGlobalHotels();
