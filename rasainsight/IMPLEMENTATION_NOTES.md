# RasaInsight — TODO Completion Notes

This project remains a browser-first application: open `index.html` directly. No Node.js, npm, framework, backend, or new runtime dependency was added.

## Completed modules

- Transactions: searchable/filterable/paginated list, detail view, new transaction flow with cart, metadata editing, status updates, delete, and automatic loyalty-point handling.
- Products: searchable/filterable/sortable catalogue, create/edit, active toggle, detail/performance view, and safe deletion guard for products already referenced by transaction history.
- Loyalty: points ledger, filters, sorting, pagination, customer balances, membership tiers, top loyal customers, and validated point redemption.
- Feedback: list, filters, rating/sentiment summaries, create/edit/delete, and automatic sentiment classification.
- Complaints: list, filters, priority/status summaries, create/edit, status progression/resolution, and delete.
- Business Intelligence: RFM scoring/segmentation and analytics tabs for revenue, product performance, and customer analytics. Product performance now excludes non-completed transactions.
- AI Insights: data-driven business summaries and recommendations computed from the current browser dataset (no fabricated AI response or external API dependency).
- Settings: JSON backup/import, per-table CSV export, import-screen shortcut, reset confirmation, storage information, and app information.
- Integration: all concrete page scripts are loaded in `index.html`; hash routes, mobile drawer dismissal, keyboard Escape behavior, and shared toast/modal components are retained.

## Reliability fixes

- Transaction creation validates customer, active products, quantities, discounts, and non-negative totals.
- Changing transaction status revokes automatically earned points when a transaction is no longer completed and restores them when completed again.
- Editing transaction metadata keeps generated loyalty records associated with the correct customer/date.
- Loyalty history rows calculate their running balance from the full ledger; redemption rejects invalid amounts and insufficient balances.
- Product deletion is blocked when historical transaction details reference that product, preserving transaction integrity.
- Feedback and complaint services validate customer references and accepted values.

## Verification performed

- `node --check` passed for every JavaScript file in `js/`.
- Service-level smoke test passed for transaction creation/update/status changes, loyalty earn/revoke/redeem, feedback creation, complaint creation, and BI summary aggregation.
- The browser automation environment blocked navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, including local `file://` and loopback URLs. Therefore, interactive viewport-by-viewport visual QA is not claimed as completed; please verify the five target widths in a normal local browser.
