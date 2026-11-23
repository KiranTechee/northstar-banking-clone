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
- Expand **Others** to open FD/RD, minor-account, loan, beneficiary, interest, statement, audit, and report workspaces
- Create and close browser-only FD/RD records with indicative maturity calculations
- Create minor-account records, review guardians, and record loan decisions/repayments
- Maintain beneficiary records and indicative product-rate settings
- Filter and print demo account statements; review local audit activity and reports

### Customer
- Sign in using matching customer ID and full name
- View available balance and account status
- Transfer money to another active customer
- View incoming and outgoing transaction history

## Important: demo only
This is a **frontend-only demonstration**. Data is stored in the browser's `localStorage`, and the demo credentials are hardcoded. It is not connected to a server, database, payment rail, identity provider, or real bank. Do not use real customer information or real money.

For a real banking application, implement a secure backend with authentication, role-based authorization, server-side balance validation, database transactions/locking, audit logs, encryption, rate limiting, and regulatory/security review. Never trust client-side balances or admin permissions. A backend should perform transfers as one atomic database transaction so debit and credit either both succeed or both roll back.

## Admin workspace prototype

The **Others** menu is available after signing in as the demo administrator. Its FD, RD, minor, loan, beneficiary, and rate records are prototype data saved in this browser's `localStorage`; they are not sent to a server. New FD/RD entries do not debit savings accounts. Interest, EMI, and maturity calculations are indicative UI previews, not bank-approved terms. Loan approval does not disburse funds, and a minor-account conversion requires a bank-policy/backend review.

To try the workspaces:
1. Sign in as `admin` / `admin123` and expand **Others**.
2. Set an indicative FD/RD rate in **Interest Management**, or enter a rate directly in the FD/RD form.
3. Create an FD or RD, then search/filter it and try closing it; RD installment entries appear in its payment history.
4. Create a minor record and review or edit the guardian fields in **Manage Minor Accounts**.
5. Submit a loan application, approve/reject it, and record a repayment against an approved application.
6. Add, edit, and delete a beneficiary; use **Account Statements** to filter transactions and print/save the statement as PDF.
7. Review local administrator events in **Audit Logs** and browser-backed aggregates in **Reports**.

These pages intentionally contain no pre-populated FD, RD, loan, minor, beneficiary, or interest-rate data. Account/customer choices and statements use the existing frontend demo data.
