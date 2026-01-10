import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { hotelComparisons } from "./drizzle/schema.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seedDemoData() {
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

    // Demo hotel comparison data
    const demoComparisons = [
      {
        hotelName: "Wyndham Grand Orlando Resort Bonnet Creek",
        location: "Orlando, FL",
        checkInDate: new Date("2025-03-06"),
        checkOutDate: new Date("2025-03-09"),
        nights: 3,
        rating: 4.5,
        hotelImage:
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=400&fit=crop",
        publicSitePrice: 289.99,
        publicSiteName: "Expedia",
        wholesaleHotelRatesPrice: 189.99,
        cashBackPercentage: 5,
        totalSavings: 100,
        comparisonScreenshots: JSON.stringify({
          publicSite: "/screenshots/expedia-wyndham.jpg",
          wholesaleHotelRates: "/screenshots/whr-wyndham.jpg",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        hotelName: "Hilton Orlando Downtown",
        location: "Orlando, FL",
        checkInDate: new Date("2025-03-06"),
        checkOutDate: new Date("2025-03-09"),
        nights: 3,
        rating: 4.7,
        hotelImage:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop",
        publicSitePrice: 349.99,
        publicSiteName: "Booking.com",
        wholesaleHotelRatesPrice: 229.99,
        cashBackPercentage: 4,
        totalSavings: 120,
        comparisonScreenshots: JSON.stringify({
          publicSite: "/screenshots/booking-hilton.jpg",
          wholesaleHotelRates: "/screenshots/whr-hilton.jpg",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        hotelName: "Ritz-Carlton Orlando, Grande Lakes",
        location: "Orlando, FL",
        checkInDate: new Date("2025-03-06"),
        checkOutDate: new Date("2025-03-09"),
        nights: 3,
        rating: 4.9,
        hotelImage:
          "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=500&h=400&fit=crop",
        publicSitePrice: 599.99,
        publicSiteName: "Hotels.com",
        wholesaleHotelRatesPrice: 399.99,
        cashBackPercentage: 5,
        totalSavings: 200,
        comparisonScreenshots: JSON.stringify({
          publicSite: "/screenshots/hotels-ritz.jpg",
          wholesaleHotelRates: "/screenshots/whr-ritz.jpg",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        hotelName: "Four Seasons Hotel Orlando at Walt Disney World Resort",
        location: "Orlando, FL",
        checkInDate: new Date("2025-03-06"),
        checkOutDate: new Date("2025-03-09"),
        nights: 3,
        rating: 4.8,
        hotelImage:
          "https://images.unsplash.com/photo-1564501049351-005e2b3e5e6f?w=500&h=400&fit=crop",
        publicSitePrice: 749.99,
        publicSiteName: "Expedia",
        wholesaleHotelRatesPrice: 499.99,
        cashBackPercentage: 5,
        totalSavings: 250,
        comparisonScreenshots: JSON.stringify({
          publicSite: "/screenshots/expedia-fourseasons.jpg",
          wholesaleHotelRates: "/screenshots/whr-fourseasons.jpg",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Clear existing data
    await connection.query("DELETE FROM hotelComparisons");

    // Insert demo data
    for (const comparison of demoComparisons) {
      await db.insert(hotelComparisons).values(comparison);
    }

    console.log("✅ Demo data seeded successfully!");
    console.log(`Added ${demoComparisons.length} hotel comparisons`);

    await connection.end();
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

seedDemoData();
