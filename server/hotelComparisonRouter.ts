import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { hotelComparisons, priceData, comparisonResults } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { runHotelComparison } from "./hotelComparison";

export const hotelComparisonRouter = router({
  /**
   * Get all available hotel comparisons
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const comparisons = await db.select().from(hotelComparisons);
      return comparisons;
    } catch (error) {
      console.error("Error fetching hotel comparisons:", error);
      return [];
    }
  }),

  /**
   * Get detailed comparison data for a specific hotel
   */
  getDetail: publicProcedure
    .input(
      z.object({
        comparisonId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        // Get hotel comparison
        const comparison = await db
          .select()
          .from(hotelComparisons)
          .where(eq(hotelComparisons.id, input.comparisonId))
          .limit(1);

        if (!comparison.length) return null;

        const hotel = comparison[0];

        // Get all price data for this comparison
        const prices = await db
          .select()
          .from(priceData)
          .where(eq(priceData.comparisonId, input.comparisonId));

        // Get comparison results
        const results = await db
          .select()
          .from(comparisonResults)
          .where(eq(comparisonResults.comparisonId, input.comparisonId));

        // Format response
        const comparisons = prices.map((price) => ({
          platform: price.platform,
          pricePerNight: parseFloat(price.pricePerNight as any),
          totalPrice: parseFloat(price.totalPrice as any),
          screenshotUrl: price.screenshotUrl,
          screenshotProcessedUrl: price.screenshotProcessedUrl,
        }));

        const savings = results.length
          ? {
              savingsAmount: parseFloat(results[0].savingsAmount as any),
              savingsPercentage: parseFloat(
                results[0].savingsPercentage as any
              ),
              cashBackAmount: parseFloat(results[0].cashBackAmount as any),
            }
          : {
              savingsAmount: 0,
              savingsPercentage: 0,
              cashBackAmount: 0,
            };

        return {
          hotelName: hotel.hotelName,
          location: hotel.location,
          checkInDate: hotel.checkInDate,
          checkOutDate: hotel.checkOutDate,
          starRating: hotel.starRating,
          description: hotel.description,
          comparisons,
          savings,
        };
      } catch (error) {
        console.error("Error fetching hotel comparison detail:", error);
        return null;
      }
    }),

  /**
   * Get a random comparison for demo purposes
   */
  getRandomDemo: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    try {
      const comparisons = await db.select().from(hotelComparisons);

      if (!comparisons.length) {
        // Return mock data if no comparisons exist
        return {
          hotelName: "Grand Hotel Orlando",
          location: "Orlando, FL",
          checkInDate: "2025-03-06",
          checkOutDate: "2025-03-09",
          starRating: 5,
          description: "Luxury 5-star resort in the heart of Orlando",
          comparisons: [
            {
              platform: "hotels.com",
              pricePerNight: 250,
              totalPrice: 750,
              screenshotUrl: "/demo/hotels-com.png",
              screenshotProcessedUrl: "/demo/hotels-com-processed.png",
            },
            {
              platform: "expedia",
              pricePerNight: 245,
              totalPrice: 735,
              screenshotUrl: "/demo/expedia.png",
              screenshotProcessedUrl: "/demo/expedia-processed.png",
            },
            {
              platform: "booking.com",
              pricePerNight: 255,
              totalPrice: 765,
              screenshotUrl: "/demo/booking.png",
              screenshotProcessedUrl: "/demo/booking-processed.png",
            },
            {
              platform: "wholesalehotelrates",
              pricePerNight: 180,
              totalPrice: 540,
              screenshotUrl: "/demo/whr.png",
              screenshotProcessedUrl: "/demo/whr-processed.png",
            },
          ],
          savings: {
            savingsAmount: 195,
            savingsPercentage: 26.2,
            cashBackAmount: 16.2,
          },
        };
      }

      // Get random comparison
      const randomComparison =
        comparisons[Math.floor(Math.random() * comparisons.length)];

      // Get prices for this comparison
      const prices = await db
        .select()
        .from(priceData)
        .where(eq(priceData.comparisonId, randomComparison.id));

      // Get results
      const results = await db
        .select()
        .from(comparisonResults)
        .where(eq(comparisonResults.comparisonId, randomComparison.id));

      const comparisonsData = prices.map((price) => ({
        platform: price.platform,
        pricePerNight: parseFloat(price.pricePerNight as any),
        totalPrice: parseFloat(price.totalPrice as any),
        screenshotUrl: price.screenshotUrl,
        screenshotProcessedUrl: price.screenshotProcessedUrl,
      }));

      const savings = results.length
        ? {
            savingsAmount: parseFloat(results[0].savingsAmount as any),
            savingsPercentage: parseFloat(results[0].savingsPercentage as any),
            cashBackAmount: parseFloat(results[0].cashBackAmount as any),
          }
        : {
            savingsAmount: 0,
            savingsPercentage: 0,
            cashBackAmount: 0,
          };

      return {
        hotelName: randomComparison.hotelName,
        location: randomComparison.location,
        checkInDate: randomComparison.checkInDate,
        checkOutDate: randomComparison.checkOutDate,
        starRating: randomComparison.starRating,
        description: randomComparison.description,
        comparisons: comparisonsData,
        savings,
      };
    } catch (error) {
      console.error("Error fetching random demo:", error);
      return null;
    }
  }),

  /**
   * Run a hotel comparison and collect real pricing data
   */
  runComparison: publicProcedure
    .input(
      z.object({
        hotelName: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("Starting hotel comparison bot...");
        await runHotelComparison(input);
        console.log("Hotel comparison completed");
        return { success: true, message: "Hotel comparison completed" };
      } catch (error) {
        console.error("Error running hotel comparison:", error);
        return {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }),
});
