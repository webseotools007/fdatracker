# Verified delivery — 15 October 2026

## Scope

The user's latest instruction replaced the earlier 54-screen RegulatoryOS scope: build a new, independent app with only Warning Letters, public Form 483s, drug recalls and drug approvals. The old application was inspected, but the edits made there during the initial approach were undone. Its code and database are not runtime dependencies of this app.

Original implementation resides in this folder. It uses standard public Next.js/React/Radix/Lucide libraries and public FDA source material, not the friend's application code.

## What works

- Original public homepage and an accessible Admin/User demo-login dialog.
- Independent dashboard with four categories, search, date filters, pagination and original FDA links.
- Admin approval/rejection with rationale and durable decision history.
- User publication visibility enforced in the server API. User cannot collect data or review records.
- Source changes return records to pending. Stale editorial writes conflict.
- Explicit reference labels distinguish manually preloaded public-source examples from actual connector results.
- Four manual source collectors, with persisted results and errors.
- SQLite persistence and signed, expiring HttpOnly local sessions.

## Verified source requests

All four latest requests returned HTTP 200. These are bounded requests, not complete coverage.

| Source | Accepted in latest request | Scope |
|---|---:|---|
| Warning Letters | 6 | Drug/biologic-office rows on the official visible table page |
| Public Form 483s | 10 | Visible official Reading Room table rows |
| Drug recalls | 99 | 100 rows requested; rows without required identity/date are excluded |
| Drug approvals | 782 | Approved original/supplement submissions within 100 recently updated application records |

The 483 RSS request returned no identifiable Form 483 entries. The official table fallback succeeded. Earlier PowerShell website probes returned 404 while the actual Node collectors later fetched the official pages successfully; only actual collector successes are reported above.

The local database contains 898 records: 7 Warning Letters (including an older preloaded reference), 10 public 483s, 99 recalls, and 782 approved-submission records. Twelve records (three per category) were explicitly published by demo-curator for the manager demonstration. The remaining 886 are pending. Demo publication is not expert regulatory review. Collection never automatically publishes new records.

## Verification results

- 12 core unit/integration tests: PASS.
- End-to-end browser journey: PASS. Covers landing, Admin entry, approval, User entry, approved-only visibility, denied User writes/source access, search/empty state, mobile menu and mobile overflow checks.
- TypeScript typecheck: PASS.
- Production build: PASS.
- Production smoke: PASS. Homepage responds; demo login returns 403; unauthenticated records return 401; source access returns 403; dashboard redirects. Tested even with DEMO_LOGIN=true in the production process.
- Actual in-app browser: homepage and approved User dashboard verified; four category counts and source-linked Form 483 records visible.

Initial failures were fixed: standalone sync script used unsupported CJS top-level await; same-origin validation needed to compare the incoming Host rather than Next's normalized loopback URL; browser selectors needed to account for button descriptions and separate loading/success regions. No assertions were skipped or disabled to obtain passing results.

## Limits and next steps

This is a working local manager preview. It is not deployed. Real registration/password login, production hosting/authentication and automatic scheduling remain unimplemented. Direct demo login is disabled in production. Local SQLite is not a production multi-tenant architecture.

The source requests do not establish real-time, complete historical or comprehensive global coverage. Original and supplemental approvals remain distinct. Public 483s are selected disclosures, not all inspections. No agents, investigator scores, EMA/CDSCO modules or other advanced RegulatoryOS features are part of this app.

Next practical step: real account authentication and a hosting setup for sharing with the manager outside this computer.

## Premium interface revision — 15 October 2026

Rebuilt the homepage composition and replaced the earlier compact purple styling throughout the customer/Admin dashboard and dialogs. Palette sampled from the rendered caliberuniversal.com homepage: navy #1e3679, teal #00aa8a and yellow #ffcd2a. Darker teal #007e69 is used on buttons/text for readability. FDA Tracker retains its own wordmark and identity.

Added self-hosted Manrope Variable through @fontsource-variable/manrope 5.3.0 (OFL-1.1). Actual browser inspection confirms desktop record titles 18px, summaries 15px, navigation 14px, and Manrope loaded. Page headings are 35px; the homepage uses a responsive display scale. Mobile record titles are 16px and summaries 14px. More generous cards/controls, stronger text contrast, a white navigation/header, neutral canvas and restrained teal/yellow highlights replace the prior small pastel text. Removed the large explanatory dashboard banner to give publications more room.

Final production build and TypeScript compilation PASS. Final isolated browser journey PASS, including approval, User access restrictions, search, mobile overflow/navigation, Manrope and explicit desktop/mobile font-size assertions. Actual homepage and source-linked 483 screen visually verified in the in-app browser. Backend, collectors, publication decisions and stored records were not changed by this styling revision.

Earlier revision checks caught an incorrect font package subpath and an existing shared-dev-directory collision. Fixed the import to the package's documented root export and gave browser tests their own .next-browser output directory. The final passing build/test results follow those corrections.

## Compact analytics revision — 15 October 2026

Reduced the site/header/sidebar/card/list dimensions through layout values, without changing browser zoom. Desktop record titles are now 16px and summaries 14px; readable Manrope remains. Added a deeper neutral canvas, navy workspace card, tinted summary cards, a navy signal-mix panel, and navy homepage hero/closing sections.

Added authenticated /api/analytics with role-scoped aggregation before counting. Customers see approved records only. Admin charts include all stored statuses and disclose that scope. Chart windows are 3/6/12 calendar months ending today UTC, with zero-filled months and category counts. Counts describe stored public records, not the whole FDA corpus or a risk measure. Publication dates remain distinct from collection times; approvals include supplements.

New overview visualizations: stacked monthly activity bars, category-mix donut, named-company count and metric sparklines. Native keyboard-accessible month buttons filter the publication list to an inclusive month range. Metric cards and donut legend entries filter categories within the same chart window. Added validated upper-date filtering to support bounded drilldowns.

Expanded the existing local demo via explicit, production-forbidden chart curation: 77 additional real public-source records were demo-published, bringing the published selection to 89 (7 letters, 10 public483s, 31 recalls, 41 approved submissions). No synthetic regulatory records were created. The default six-month customer chart shows 76 publications from 53 named companies: 6 letters,10 public483s,31 recalls,29 approved submissions. The per-month totals are May4,June5,July2,August20,September27,October18. Demo decisions retain a rationale explicitly stating they are not expert regulatory review. No collector auto-approval was introduced.

Validation: 15 core tests PASS; typecheck PASS; final build PASS. Browser journey PASS with chart-window changes, monthly drilldown, customer analytics scope, denied anonymous analytics, existing approval/search flow, mobile navigation/overflow and compact readable typography checks. Actual homepage and populated overview visually checked in the in-app browser; outputs/compact-homepage.png and outputs/compact-overview.png are saved in the parent deliverables folder.
