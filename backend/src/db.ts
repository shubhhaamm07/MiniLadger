import "dotenv/config";
import pg from "../node_modules/@types/pg/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env.");
}

export const pool = new pg.Pool({ connectionString }); // here Pool is managing the connection between the project and the PostgeresdATABASE uRL and the pool is bascially given name so that after ward we can use it 
