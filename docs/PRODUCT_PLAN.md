# SellerMate Professional Rebuild

## Product decision
SellerMate is a Complete Business Platform for small shops, online sellers, wholesalers, retailers, and service businesses.

Brand direction: Bold & Unique.
Working tagline: Think Smart. Grow Bigger.
Product promise: one simple workspace to run the day-to-day business and understand its performance.

## Rebuild principles
- Build mobile-first for Android browsers and installable PWA.
- Do not present sample/demo data as real business data.
- Every feature must persist to PostgreSQL and be scoped to an authorized business.
- Enforce tenant isolation with Supabase Row Level Security and server-side authorization.
- Keep private keys and AI provider credentials server-side only.
- Do not send business data to AI without an explicit, understandable permission flow.
- Validate financial calculations and preserve an audit trail for important changes.
- Test empty states, invalid inputs, loading, errors, mobile layouts, and cross-business access.

## Product modules

### Release 1: Secure foundation
- Supabase authentication and session handling
- Business workspace creation and membership model
- Business profile, currency (BDT), timezone (Asia/Dhaka), language preferences
- Database migrations, indexes, RLS policies, and authorization tests
- Responsive application shell and navigation
- Clear demo/sample data removal

### Release 2: Daily operations
- Products, categories, units, purchase cost, selling price
- Inventory balances and stock movement ledger
- Customers and suppliers
- Sales, sale line items, discounts, returns
- Purchases and purchase line items
- Expenses and payment records
- Invoice/receipt generation

### Release 3: Finance and reporting
- Cash/bank accounts and account transactions
- Customer receivables and supplier payables
- Profit and loss, cash flow, sales and stock reports
- Date filters and export
- Reconciliation and audit history

### Release 4: Business intelligence
- Business health indicators based on transparent formulas
- Low-stock, overdue balance, and unusual-expense alerts
- Product and sales trend analysis
- AI advisor behind server-side controls, consent, and data minimization

### Release 5: Team and launch
- Team invitations and role-based permissions
- Activity logs, backup/restore and data export/deletion
- PWA install/offline-safe behavior
- Performance, accessibility, security, and real-device testing

## Initial data model
Core tables planned:
- profiles
- businesses
- business_members
- business_settings
- product_categories
- products
- stock_movements
- customers
- suppliers
- sales
- sale_items
- purchases
- purchase_items
- expenses
- payments
- accounts
- account_transactions
- audit_logs

All business-owned records must include business_id and have policies that verify membership and role. Financial records should not be silently overwritten; corrections should be traceable.

## Definition of done
A feature is complete only when:
1. It works through the real UI.
2. It validates input on the server.
3. It persists to the database and survives refresh/re-login.
4. Calculations are verified against test cases.
5. RLS prevents access from another business.
6. Loading, empty, error, and success states are handled.
7. It is usable on a narrow Android screen.
8. Relevant tests/build checks pass.

## Current repository audit
- Next.js 14, React 18, TypeScript, Supabase JS are present.
- Supabase auth gate currently checks/creates a `businesses` row.
- Main dashboard currently uses hard-coded starter records and browser localStorage for sales, expenses, customers, and products.
- The checked-in Supabase migration is for a separate data marketplace schema; it does not define the complete SellerMate business-management schema.
- Therefore the current app is an early MVP, not a production-ready business platform.

## Immediate next engineering tasks
1. Design and apply the core business schema in a new migration; do not drop or overwrite existing tables.
2. Verify the existing `businesses` table and its policies before relying on it.
3. Add business-scoped server-side data access.
4. Replace localStorage demo records with real database-backed operations, beginning with products and sales.
5. Redesign the application shell and screens around the approved Bold & Unique direction.
