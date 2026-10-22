import express from "express";
import { requireAuth } from "./middleware/requireAuth.js";
import { pool } from "./db.js";
import type { Loan } from "./loan.js";

export const loanRouter = express.Router();

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
//We are converting the rupee into paise money needs exact two-decimal values. Storing whole paise makes calculations such as adding loan amounts more reliable.
function toPaise(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const paise = Math.round(value * 100);
  //paise > 2_147_483_647 max value of the paise stored
  if (Math.abs(value * 100 - paise) > 0.000001 || paise > 2_147_483_647) {
    return null;
  }

  return paise;
}

loanRouter.post("/loans", requireAuth, async (request, response) => {
  const friendName = request.body?.friendName;
  const amountPaise = toPaise(request.body?.amount);
  const dueDate = request.body?.dueDate;

  if (typeof friendName !== "string" || !friendName.trim() || friendName.trim().length > 100) {
    response.status(400).json({ message: "Friend name must be 1 to 100 characters." });
    return;
  }
  if (amountPaise === null) {
    response.status(400).json({ message: "Amount must be positive, with at most two decimal places." });
    return;
  }
  if (!isValidDate(dueDate)) {
    response.status(400).json({ message: "Due date must be a real date in YYYY-MM-DD format." });
    return;
  }

  try {
    const result = await pool.query<Loan>(
      `INSERT INTO loans (user_id, friend_name, amount_paise, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id AS "userId", friend_name AS "friendName",
                 amount_paise AS "amountPaise", due_date::text AS "dueDate",
                 repaid_at::text AS "repaidAt"`,
      [response.locals.userId, friendName.trim(), amountPaise, dueDate],
    );
    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Could not add loan:", error);
    response.status(503).json({ message: "Could not save the loan." });
  }
});

loanRouter.get("/loans", requireAuth, async (_request, response) => {
  try {
    const result = await pool.query<Loan>(
      `SELECT id, user_id AS "userId", friend_name AS "friendName",
              amount_paise AS "amountPaise", due_date::text AS "dueDate",
              repaid_at::text AS "repaidAt"
       FROM loans
       WHERE user_id = $1
       ORDER BY due_date ASC, id DESC`,
      [response.locals.userId],
    );
    response.json(result.rows);
  } catch (error) {
    console.error("Could not list loans:", error);
    response.status(503).json({ message: "Could not load loans." });
  }
});

loanRouter.patch("/loans/:id/repaid", requireAuth, async (request, response) => {
  const loanId = Number(request.params.id);
  if (!Number.isSafeInteger(loanId) || loanId <= 0) {
    response.status(400).json({ message: "Loan ID must be a positive number." });
    return;
  }

  try {
    const result = await pool.query<Loan>(
      `UPDATE loans
       SET repaid_at = COALESCE(repaid_at, NOW())
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id AS "userId", friend_name AS "friendName",
                 amount_paise AS "amountPaise", due_date::text AS "dueDate",
                 repaid_at::text AS "repaidAt"`,
      [loanId, response.locals.userId],
    );

    if (result.rows.length === 0) {
      response.status(404).json({ message: "Loan not found." });
      return;
    }

    response.json(result.rows[0]);
  } catch (error) {
    console.error("Could not mark loan repaid:", error);
    response.status(503).json({ message: "Could not update the loan." });
  }
});
