import Constants from "expo-constants";
import { Platform } from "react-native";
import type { Loan, LoginResult, Summary } from "./types";

const expoHost = Constants.expoConfig?.hostUri
  ?.replace(/^https?:\/\//, "")
  .split(":")[0];

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://" +
    (Platform.OS === "web" ? "localhost" : expoHost || "localhost") +
    ":3000";

type Method = "GET" | "POST" | "PATCH";

async function apiRequest<T>(
  path: string,
  method: Method,
  token?: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error("Cannot reach the MiniLedger server at " + API_URL + ".");
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

export function requestOtp(phone: string): Promise<{ message: string }> {
  return apiRequest("/auth/request-otp", "POST", undefined, { phone });
}

export function verifyOtp(phone: string, otp: string): Promise<LoginResult> {
  return apiRequest("/auth/verify-otp", "POST", undefined, { phone, otp });
}

export function getLoans(token: string): Promise<Loan[]> {
  return apiRequest("/loans", "GET", token);
}

export function getSummary(token: string): Promise<Summary> {
  return apiRequest("/summary", "GET", token);
}

export function addLoan(
  token: string,
  loan: { friendName: string; amount: number; dueDate: string },
): Promise<Loan> {
  return apiRequest("/loans", "POST", token, loan);
}

export function markLoanRepaid(token: string, loanId: number): Promise<Loan> {
  return apiRequest("/loans/" + loanId + "/repaid", "PATCH", token);
}
