# Northstar Banking UI (React + Vite)

A responsive **frontend demo** of a banking dashboard with separate customer and administrator experiences.

## Run locally
1. Install Node.js 18+ (Node 20 recommended).
2. Extract this ZIP.
3. Open the extracted `banking-app-ui` folder in VS Code.
4. Open a terminal in that folder and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually http://localhost:5173).

## Demo sign-ins
- **Admin:** username `admin`, password `admin123`
- **Customer:** ID `NS10001`, name `Aarav Sharma`
- Other seeded customers: `NS10002 / Diya Patel`, `NS10003 / Rohan Kumar` (blocked), `NS10004 / Ananya Iyer`

## Included features
### Admin
- Create customer accounts (the app generates a customer ID)
- View/search customer accounts
- Activate or block accounts
- Add funds to a customer account
- Delete customer accounts
- View all transactions and account totals

### Customer
- Sign in using matching customer ID and full name
- View available balance and account status
- Transfer money to another active customer
- View incoming and outgoing transaction history

## Important: demo only
This is a **frontend-only demonstration**. Data is stored in the browser's `localStorage`, and the demo credentials are hardcoded. It is not connected to a server, database, payment rail, identity provider, or real bank. Do not use real customer information or real money.

For a real banking application, implement a secure backend with authentication, role-based authorization, server-side balance validation, database transactions/locking, audit logs, encryption, rate limiting, and regulatory/security review. Never trust client-side balances or admin permissions. A backend should perform transfers as one atomic database transaction so debit and credit either both succeed or both roll back.
