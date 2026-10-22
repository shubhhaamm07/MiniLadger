import type { NextFunction, Request, Response } from "express";
import { getSessionUserId } from "../session.js";

// Request describes what came in; Response is what we send back.
// NextFunction lets the request continue to the protected route.
export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const userId = token ? getSessionUserId(token) : null;

  if (userId === null) {
    response.status(401).json({ message: "Please log in." });
    return;
  }

  response.locals.userId = userId;
  next();
}
