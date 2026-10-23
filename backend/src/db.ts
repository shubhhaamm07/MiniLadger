import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env.");
}

// One pool manages reusable PostgreSQL connections for all API routes.
export const pool = new pg.Pool({ connectionString });
