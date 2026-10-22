import express from "express";
import { pool } from "./db.js";
import { authRouter } from "./auth.js";
import { loanRouter } from "./loans.js";
import { summaryRouter } from "./summary.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

// The Expo web preview runs on a different local port from this API.
app.use((request, response, next) => {
  if (process.env.NODE_ENV !== "production" && request.headers.origin) {
    response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.setHeader("Vary", "Origin");
    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }
  }
  next();
});

app.use(express.json());
app.use(authRouter);
app.use(loanRouter);
app.use(summaryRouter);

app.get("/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1"); // SELECT 1 is very small SQL query that ask PostgresSQl to return the number 1
    response.json({ message: "MiniLedger server and database are running" });
  } catch (error) {
    console.error("Database health check failed:", error);
    response.status(503).json({ message: "Database unavailable" });
  }
});

app.listen(port, () => {
  console.log(`MiniLedger server listening on http://localhost:${port}`);
});
