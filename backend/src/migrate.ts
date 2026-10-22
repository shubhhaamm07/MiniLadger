import { readFile } from "node:fs/promises";
import { pool } from "./db.js";

const schemaPath = new URL("../db/schema.sql", import.meta.url);
const schema = await readFile(schemaPath, "utf8");

try {
  await pool.query(schema);
  console.log("MiniLedger tables are ready.");
} finally {
  await pool.end();
}
