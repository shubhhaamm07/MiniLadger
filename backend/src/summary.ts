import express from "express";
import { pool } from "./db.js";
import { requireAuth } from "./middleware/requireAuth.js";

type SummaryRow = {
  totalLentPaise: string;
  totalRepaidPaise: string;
  overduePaise: string;
};

export const summaryRouter = express.Router();

summaryRouter.get("/summary", requireAuth, async (_request, response) => {
  try {
    const result = await pool.query<SummaryRow>(
      `SELECT
         COALESCE(SUM(amount_paise), 0)::text AS "totalLentPaise",
         COALESCE(SUM(amount_paise) FILTER (WHERE repaid_at IS NOT NULL), 0)::text AS "totalRepaidPaise",
         COALESCE(SUM(amount_paise) FILTER (WHERE repaid_at IS NULL AND due_date < CURRENT_DATE), 0)::text AS "overduePaise"
       FROM loans
       WHERE user_id = $1`,
      [response.locals.userId],
    );

    const row = result.rows[0];
    const summary = {
      totalLentPaise: Number(row.totalLentPaise),
      totalRepaidPaise: Number(row.totalRepaidPaise),
      overduePaise: Number(row.overduePaise),
    };

    if (Object.values(summary).some((amount) => !Number.isSafeInteger(amount))) {
      throw new Error("Summary is too large for a JavaScript number.");
    }

    response.json(summary);
  } catch (error) {
    console.error("Could not load summary:", error);
    response.status(503).json({ message: "Could not load summary." });
  }
});
