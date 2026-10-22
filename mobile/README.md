# MiniLedger app

This Expo app lets one signed-in user record money lent to friends. The backend owns the data and calculates the summary. The app displays those values and sends user actions to the API.

## Run locally

1. Start PostgreSQL and the backend first. The backend should answer at `http://localhost:3000/health`.
2. In `mobile/`, run `npm install` and then `npx expo start`.
3. Open the web preview or scan the QR code with Expo Go. Keep the phone and computer on the same network.
4. Enter a phone number such as `+919876543210`. The mock OTP appears in the **backend terminal**. Enter that six-digit code in the app.

The app normally finds the backend using Expo's development host. If the phone cannot connect, copy `.env.example` to `.env` and replace the example IP address with your computer's local network IP. Restart Expo after changing `.env`.

## Where the code lives

| File | Purpose |
| --- | --- |
| `src/app/index.tsx` | Phone and OTP login screen |
| `src/app/dashboard.tsx` | Summary card, loans, overdue styling, repayment action |
| `src/app/add.tsx` | New-loan form and validation |
| `src/lib/api.ts` | One place for all backend requests |
| `src/lib/format.ts` | Rupee/date formatting and overdue check |
| `src/context/AuthContext.tsx` | Shares the login token between screens |

The backend stores amounts in **paise** to avoid decimal-money rounding errors. For example, ₹1,200.50 is stored as `120050` paise. The app converts it back to rupees for display.

The login token is kept in memory for this small demo. Closing or reloading the app means signing in again. Receipt photos and real SMS delivery are outside this version.
