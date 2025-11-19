# signup-form

Fullstack signup flow: React frontend + Node/Express backend. Connects to MS SQL and invokes stored procedures described in the user's document.

## Setup

### Backend
1. `cd backend`
2. `cp  .env` and fill DB credentials (DB_USER, DB_PASSWORD, DB_SERVER, DB_DATABASE, DB_PORT). Set API_ORIGIN to your frontend origin (e.g. http://localhost:5000).
3. `npm install`
4. `npm run dev` (requires nodemon) or `npm start`

### Frontend
1. `cd frontend`
2. `cp .env` and verify VITE_API_BASE if different.
3. `npm install`
4. `npm run dev` (starts Vite dev server, default http://localhost:5173 unless changed)

## Important notes
- Password hashing: frontend currently hashes with `bcryptjs` before sending (document asked to encrypt while sending). For more security, prefer sending via HTTPS and hashing on server and/or using proper KMS.
- Stored procedure outputs: If your procedures use output parameters (e.g. status codes), you may need to adapt `controllers/authController.js` to read `.output` fields precisely (I tried to handle typical patterns).
- `InsertClientMasterData` response reading is defensive. If the proc returns explicit OUTPUT parameter names, add matching `.output()` calls before `.execute()`.
- Website validation: backend `check-url` uses HEAD request (timeout 5s). Some websites block HEAD — backend may fall back to GET if needed.
- OTP flow: `generate-otp` calls `Generate_Insert(user_id)` and `verify-otp` calls `Verify_Auth(UserId, Token)` and returns `RETCODE` and `Msg`.

## Status mappings (per your doc)
- `-4` → exception (Contact info@company.co.in)
- `-3` → GST duplicate (merchant master)
- `-2` → Duplicate Email (redirect to sign-in)
- `-1` → generic error
- `other` → success (expect an ID returned)

If you want, I can:
- adapt backend to hash passwords server-side instead,
- modify to use JWT session after OTP verification,
- or create SQL examples showing how to output a `Status` and `Id` from your stored procedure.

