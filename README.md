# MiniLedger

MiniLedger is a small app for tracking money lent to friends. Sign in with a phone number, record who borrowed money and when it is due, then mark the loan as repaid. The dashboard shows the total lent, total repaid, amount still to receive, and overdue amount.

The project has a **Node.js + TypeScript + PostgreSQL API** and a **React Native app built with Expo**. The app runs on iOS, Android, and the web during development.

![Two friends exchanging money](mobile/assets/illustrations/friends-exchange.svg)

## What you can do

- Sign in using a **mock OTP**. The six-digit code is printed in the backend terminal; no text message is sent.
- Add a loan with a friend's name, amount in rupees, and due date selected from a calendar.
- View loans and filter them by **All**, **Pending**, **Overdue**, or **Repaid**.
- Highlight overdue loans and mark a loan as repaid.
- See a summary for the signed-in user. Each user's loans are kept separate.
- Use responsive layouts on narrow phones, larger devices, and the web.

Receipt photo uploads and real SMS delivery are **not implemented**.

## Requirements

- Node.js **22.13+** or **24.3+**, with npm (the installed Expo version requires one of these supported Node.js lines).
- Docker Desktop, for the local PostgreSQL database.
- For a phone preview: Expo Go on an iPhone or Android device connected to the same network as your computer. You can also use the web preview.

## Run locally

Run these commands from the repository root. Use separate terminals for the backend and the app.

**Terminal 1 — database and backend**

~~~bash
docker compose up -d db
cd backend
npm ci
cp .env.example .env
npm run db:migrate
npm run dev
~~~

The database listens on port **5433** on your computer. The backend listens on **http://localhost:3000**. Open http://localhost:3000/health to check that both the server and database are running.

If you already have a configured backend/.env, keep it instead of copying the example over it. The example DATABASE_URL points to the database defined in compose.yaml.

**Terminal 2 — React Native app**

~~~bash
cd mobile
npm ci
npm start
~~~

Follow the Expo terminal instructions to open the web preview, an emulator, or Expo Go. On a physical phone, keep the phone and computer on the same Wi-Fi network.

The app normally finds the backend using Expo's development host. If the phone cannot connect, copy mobile/.env.example to mobile/.env, replace its example IP address with your computer's local network IP, and restart Expo:

~~~text
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
~~~

The IP above is only an example. Do not use localhost in this setting for a physical phone: on the phone, localhost means the phone itself.

## Try the app

1. Enter a phone number with country code, such as **+919876543210**, and request an OTP.
2. Read the six-digit code printed in the **backend terminal** and enter it in the app. The code expires after **5 minutes**.
3. Add a loan, for example: Maya, **₹1,200.50**, due on a date you choose.
4. Return to the dashboard to see the loan and updated totals. After its due date passes, an unpaid loan appears as overdue.
5. Mark it as repaid to update its status and the summary.

The OTP is only a development demonstration. It does not prove that the person using the app owns the phone number.

## How it works

| Part | Responsibility |
| --- | --- |
| mobile/src/app/ | Login, dashboard, and add-loan screens, connected with Expo Router |
| mobile/src/lib/api.ts | Sends requests to the backend |
| mobile/src/context/AuthContext.tsx | Holds the current login token while the app is open |
| mobile/assets/illustrations/ | SVG artwork used across the screens |
| backend/src/auth.ts | Generates and verifies mock OTPs, then creates a login session |
| backend/src/loans.ts | Adds, lists, and repays loans belonging to the signed-in user |
| backend/src/summary.ts | Calculates totals for the signed-in user |
| backend/src/middleware/requireAuth.ts | Checks the bearer token before protected routes |
| backend/db/schema.sql | Defines the users and loans tables |
| compose.yaml | Starts PostgreSQL for local development |

Amounts are stored as whole **paise** to avoid decimal rounding problems. For example, **₹1,200.50** is stored as **120050 paise**. The API accepts rupees when creating a loan, returns paise in its responses, and the app formats paise back into rupees for display.

The dashboard calculates **Still to receive = Total lent − Total repaid**. The overdue amount includes only unpaid loans whose due date is **before today**. A loan due today is not overdue yet.

## API

Base URL: **http://localhost:3000**. All routes except the health check and OTP routes require an Authorization header containing the token returned by OTP verification: **Bearer YOUR_TOKEN**.

| Method | Route | Purpose | Request body |
| --- | --- | --- | --- |
| GET | /health | Check the server and database | — |
| POST | /auth/request-otp | Print a mock OTP in the backend log | {"phone":"+919876543210"} |
| POST | /auth/verify-otp | Verify the code and return a token and user | {"phone":"+919876543210","otp":"123456"} |
| GET | /auth/me | Return the signed-in user's ID | — |
| GET | /loans | List the signed-in user's loans | — |
| POST | /loans | Add a loan | {"friendName":"Maya","amount":1200.50,"dueDate":"2026-10-30"} |
| PATCH | /loans/:id/repaid | Mark one of the user's loans as repaid | — |
| GET | /summary | Return the signed-in user's totals | — |

The OTP in the example request is a placeholder. Use the code printed by your backend. The due date format sent to the API is **YYYY-MM-DD**.

A loan response contains id, userId, friendName, amountPaise, dueDate, and repaidAt. The last field is null until repayment. The summary response contains totalLentPaise, totalRepaidPaise, and overduePaise. The app derives “Still to receive” from the first two totals.

The backend checks that names are non-empty and at most 100 characters, amounts are positive with at most two decimal places, and due dates are real calendar dates. Loan queries use the signed-in user's ID, so one user cannot list or repay another user's loans.

## Check the code

~~~bash
cd backend
npm run build
~~~

~~~bash
cd mobile
npm run lint
npx tsc --noEmit
~~~

There is currently no automated test suite. For a manual check, use the app or Postman to request an OTP, verify it, add a loan, view /loans and /summary, mark the loan repaid, and check the updated summary.

## Troubleshooting

- **Login fails with ECONNREFUSED on port 5433:** PostgreSQL is unavailable. Start Docker Desktop and run docker compose up -d db from the repository root. Then check /health. The backend can generate and print an OTP while the database is down, but verifying the OTP needs the database.
- **Port 5433 is already allocated:** Another container or process already owns the port. Run docker ps to identify it. If an existing MiniLedger database container named miniledger-db-1 is already running and /health succeeds, use it rather than starting a second database.
- **The phone cannot reach the API:** Check that the backend is running, the phone and computer share a network, and EXPO_PUBLIC_API_URL uses your computer's reachable LAN IP. Restart Expo after changing the app's .env file.
- **The OTP is invalid or expired:** Request a new one from the app and use the latest code printed in the backend terminal. Restarting the backend also clears pending codes and login sessions.

## Current scope

This is a local development and interview project. Mock OTPs and login sessions are stored **in server memory**, and the app keeps its token **in memory**. Restarting the backend clears codes and sessions; reloading the app requires signing in again. Real SMS delivery, persistent production-grade authentication, and receipt uploads would be separate follow-up work.
