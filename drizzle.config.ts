import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Auto-detect database type from connection string if not explicitly set
let dbDialect: "mysql" | "postgresql" = (process.env.DB_DIALECT as any) || "mysql";
if (!process.env.DB_DIALECT) {
  if (connectionString.includes("mysql")) {
    dbDialect = "mysql";
  } else if (connectionString.includes("postgres")) {
    dbDialect = "postgresql";
  } else {
    dbDialect = "mysql"; // default
  }
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: dbDialect as "mysql" | "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
