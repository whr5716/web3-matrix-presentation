import { getDb } from "./server/db";
import { hotelComparisons, priceData, comparisonResults } from "./drizzle/schema";

async function seedDemoData() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Database connection failed");
      process.exit(1);
    }

    // Demo hotel comparison data
    const hotels = [
      {
        hotelName: "Wyndham Grand Orlando Resort Bonnet Creek",
        location: "Orlando, FL",
        checkInDate: "2025-03-06",
        checkOutDate: "2025-03-09",
        starRating: 4,
        description: "Luxury resort near Disney World",
        publicPrice: 289.99,
        wholesalePrice: 189.99,
        platform: "Expedia",
      },
      {
        hotelName: "Hilton Orlando Downtown",
        location: "Orlando, FL",
        checkInDate: "2025-03-06",
        checkOutDate: "2025-03-09",
        starRating: 5,
        description: "Downtown luxury hotel",
        publicPrice: 349.99,
        wholesalePrice: 229.99,
        platform: "Booking.com",
      },
      {
        hotelName: "Ritz-Carlton Orlando, Grande Lakes",
        location: "Orlando, FL",
        checkInDate: "2025-03-06",
        checkOutDate: "2025-03-09",
        starRating: 5,
        description: "Ultra-luxury resort",
        publicPrice: 599.99,
        wholesalePrice: 399.99,
        platform: "Hotels.com",
      },
      {
        hotelName: "Four Seasons Hotel Orlando",
        location: "Orlando, FL",
        checkInDate: "2025-03-06",
        checkOutDate: "2025-03-09",
        starRating: 5,
        description: "Premium resort at Walt Disney World",
        publicPrice: 749.99,
        wholesalePrice: 499.99,
        platform: "Expedia",
      },
    ];

    // Clear existing data
    await db.execute(`DELETE FROM comparisonResults`);
    await db.execute(`DELETE FROM priceData`);
    await db.execute(`DELETE FROM hotelComparisons`);

    // Insert hotel comparisons and prices
    for (const hotel of hotels) {
      // Insert hotel comparison
      const comparisonResult = await db
        .insert(hotelComparisons)
        .values({
          hotelName: hotel.hotelName,
          location: hotel.location,
          checkInDate: hotel.checkInDate,
          checkOutDate: hotel.checkOutDate,
          starRating: hotel.starRating,
          description: hotel.description,
        });

      const comparisonId = comparisonResult[0].insertId;

      // Insert public platform price
      const publicPriceResult = await db
        .insert(priceData)
        .values({
          comparisonId: comparisonId,
          platform: hotel.platform,
          pricePerNight: hotel.publicPrice.toString(),
          totalPrice: (hotel.publicPrice * 3).toString(),
          currency: "USD",
          screenshotUrl: "https://via.placeholder.com/500x400?text=Public+Price",
          extractedData: {
            price: hotel.publicPrice,
            platform: hotel.platform,
          },
        });

      // Insert wholesale hotel rates price
      const wholesalePriceResult = await db
        .insert(priceData)
        .values({
          comparisonId: comparisonId,
          platform: "Wholesale Hotel Rates",
          pricePerNight: hotel.wholesalePrice.toString(),
          totalPrice: (hotel.wholesalePrice * 3).toString(),
          currency: "USD",
          screenshotUrl:
            "https://via.placeholder.com/500x400?text=Wholesale+Price",
          extractedData: {
            price: hotel.wholesalePrice,
            platform: "Wholesale Hotel Rates",
          },
        });

      // Calculate savings
      const savingsAmount = hotel.publicPrice - hotel.wholesalePrice;
      const savingsPercentage = (
        (savingsAmount / hotel.publicPrice) *
        100
      ).toFixed(2);
      const cashBackAmount = (hotel.wholesalePrice * 0.05).toFixed(2); // 5% cash back

      // Insert comparison results
      await db.insert(comparisonResults).values({
        comparisonId: comparisonId,
        wholesaleHotelRatesId: wholesalePriceResult[0].insertId,
        publicPlatformId: publicPriceResult[0].insertId,
        savingsAmount: savingsAmount.toString(),
        savingsPercentage: savingsPercentage,
        cashBackAmount: cashBackAmount,
      });
    }

    console.log("✅ Demo data seeded successfully!");
    console.log(`Added ${hotels.length} hotel comparisons with pricing data`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

seedDemoData();
