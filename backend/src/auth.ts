import { randomInt } from "node:crypto"; // creates a six-digit OTP
import express from "express";
import { pool } from "./db.js";
import { createSession } from "./session.js";
import { requireAuth } from "./middleware/requireAuth.js";
// Definng the Shape of the data 
type PendingOtp = { code: string; expiresAt: number; attempts: number };


//Creating a Place to store the data .Map is mainly used 
const pendingOtps = new Map<string, PendingOtp>();

//Expiring time of OTP
const otpLifetimeMs = 5 * 60 * 1000;

export const authRouter = express.Router();

authRouter.post("/auth/request-otp", (request, response) => {
  const phone = request.body?.phone;

  // phone isn’t text and The phone number doesn’t match the pattern.
  if (typeof phone !== "string" || !/^\+?[1-9]\d{9,14}$/.test(phone.trim())) {
    response.status(400).json({ message: "Enter a valid phone number." });
    return;
  }

  const normalizedPhone = phone.trim(); // trim mainly removes spaces form the start and end of the phone number
  const code = String(randomInt(100000, 1000000));
  // Storing the (normalizedPhone, Obj) to the map
  pendingOtps.set(normalizedPhone, {
    code,
    expiresAt: Date.now() + otpLifetimeMs,
    attempts: 0,
  });

  console.log(`MiniLedger OTP for ${normalizedPhone}: ${code}`);
  response.json({ message: "OTP generated. Check the server log." });
});

authRouter.post("/auth/verify-otp", async (request, response) => {
  const phone = request.body?.phone;
  const otp = request.body?.otp;
  
  if (typeof phone !== "string" || typeof otp !== "string") {
    response.status(400).json({ message: "Phone and OTP are required." });
    return;
  }
  const normalizedPhone = phone.trim();
  const pending = pendingOtps.get(normalizedPhone);

  if (!pending || Date.now() >= pending.expiresAt || pending.attempts >= 5) {
    pendingOtps.delete(normalizedPhone);
    response.status(401).json({ message: "Invalid or expired OTP." });
    return;
  }

  if (pending.code !== otp.trim()) {
    pending.attempts += 1;
    response.status(401).json({ message: "Invalid or expired OTP." });
    return;
  }

  try {
    const result = await pool.query<{ id: number; phone: string }>(
      "INSERT INTO users (phone) VALUES ($1) ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone RETURNING id, phone",
      [normalizedPhone],
    );
    const user = result.rows[0];
    const token = createSession(user.id);
    pendingOtps.delete(normalizedPhone);

    response.json({ token, user });
  } catch (error) {
    console.error("Login failed:", error);
    response.status(503).json({ message: "Login is temporarily unavailable." });
  }
});

authRouter.get("/auth/me", requireAuth, (_request, response) => {
  response.json({ userId: response.locals.userId });
});
