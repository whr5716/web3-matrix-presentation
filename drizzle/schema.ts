import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Hotel comparison data - stores pre-collected pricing and screenshot data
 */
export const hotelComparisons = mysqlTable("hotelComparisons", {
  id: int("id").autoincrement().primaryKey(),
  hotelName: varchar("hotelName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  checkInDate: varchar("checkInDate", { length: 10 }).notNull(), // YYYY-MM-DD format
  checkOutDate: varchar("checkOutDate", { length: 10 }).notNull(),
  starRating: int("starRating"), // 1-5 stars
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HotelComparison = typeof hotelComparisons.$inferSelect;
export type InsertHotelComparison = typeof hotelComparisons.$inferInsert;

/**
 * Price data from different booking platforms
 */
export const priceData = mysqlTable("priceData", {
  id: int("id").autoincrement().primaryKey(),
  comparisonId: int("comparisonId").notNull(), // Foreign key to hotelComparisons
  platform: varchar("platform", { length: 50 }).notNull(), // "hotels.com", "expedia", "booking.com", "wholesalehotelrates"
  pricePerNight: decimal("pricePerNight", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  screenshotUrl: text("screenshotUrl"), // URL to stored screenshot
  screenshotProcessedUrl: text("screenshotProcessedUrl"), // URL to processed/highlighted screenshot
  extractedData: json("extractedData"), // JSON data extracted from screenshot (hotel name, price, rating, etc)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PriceData = typeof priceData.$inferSelect;
export type InsertPriceData = typeof priceData.$inferInsert;

/**
 * Calculated savings and comparison results
 */
export const comparisonResults = mysqlTable("comparisonResults", {
  id: int("id").autoincrement().primaryKey(),
  comparisonId: int("comparisonId").notNull(), // Foreign key to hotelComparisons
  wholesaleHotelRatesId: int("wholesaleHotelRatesId"), // Foreign key to priceData (WHR price)
  publicPlatformId: int("publicPlatformId"), // Foreign key to priceData (public site price)
  savingsAmount: decimal("savingsAmount", { precision: 10, scale: 2 }).notNull(),
  savingsPercentage: decimal("savingsPercentage", { precision: 5, scale: 2 }).notNull(),
  cashBackAmount: decimal("cashBackAmount", { precision: 10, scale: 2 }).notNull(), // 3-5% of WHR price
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComparisonResult = typeof comparisonResults.$inferSelect;
export type InsertComparisonResult = typeof comparisonResults.$inferInsert;
