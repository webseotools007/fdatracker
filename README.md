# FDA Tracker — independent, focused manager preview

An original Next.js application built separately from the previously referenced RegulatoryOS application. No application code, database, theme files or agent implementations were copied from that project.

The scope is deliberately small:

- FDA Warning Letters
- Public Form FDA 483s
- Drug recalls
- Drug approvals (original and supplemental submissions explicitly distinguished)

Includes an original public homepage, accessible Admin/User login dialog, a white sidebar/header with light-gray canvas and Caliber-inspired navy, teal and yellow accents with self-hosted Manrope typography, category totals, company/product/keyword search, date filtering, pagination, source-linked detail dialogs and a persistent Admin approve/reject workflow.

## Run

Requires Node.js 24+ and npm.

    npm ci
    npm run dev

Open http://127.0.0.1:3037. Click Log in, then Log in as Admin or Log in as User.

These are intentionally direct local demonstration logins, not real registered accounts. The launcher binds to loopback. Production rejects demo sessions even if DEMO_LOGIN is set. Real signup, password login, email, hosted multi-user authorization and deployment are not implemented.

## Review and publication

Admin sees collected records, a pending review queue and four data connections. Open a record, follow its original FDA source, enter a rationale, then approve or reject it. Users receive only approved records at the server/API level. They cannot access source collection or editorial writes.

New or changed source records start pending. Source changes invalidate the previous approval. Every decision has an actor, version, rationale and timestamp. Concurrent stale decisions return a conflict. Search/date filters and publication totals use stored data.

The manager demonstration initially included three published records from each category. A later chart-demo curation expanded the published selection to 89 real stored public-source records, explicitly approved for demonstration, not expert regulatory review. This is separate from collection. Future collections never auto-approve.

The overview now includes role-scoped 3/6/12-month publication charts, a category-mix donut and summary-card sparklines. Click an activity bar to filter the list to that month, or a mix legend to explore that category within the chart window. Counts describe the selected stored records, not all FDA activity. Approval records include supplements. User analytics exclude pending and rejected records at the database layer.

## Public data

    npm run sync

Or use Admin → Data connections → Check & collect.

| Category | Connector | Boundaries |
|---|---|---|
| Warning Letters | Official FDA table, current page | Drug/biologic issuing offices only. Not all FDA sectors or complete history. |
| Public Form 483s | Official Reading Room RSS; official table fallback | Only selected public records. RSS may contain no identifiable 483 entries. Table collection covers the visible page. |
| Drug recalls | openFDA drug/enforcement | Latest 100 reported rows requested. Invalid/missing required fields are excluded. Dates shown are FDA report dates; recall initiation is separate. |
| Drug approvals | openFDA drug/drugsfda | 100 recently updated applications requested; approved submissions within those applications are stored. Includes historical submissions and supplements. Not a complete chronological approval feed. |

Source runs retain start/end time, HTTP status, counts and errors. Admin can see which request actually worked. No background scheduler or instant alert service is running. No complete, real-time or worldwide coverage claim is made.

The file data/reference-records.json contains six manually curated real FDA examples with official source links and explicit reference labels. They are used when first creating a database. They are not represented as a successful live sync, and start pending. Actual API/table collections have separate capture timestamps.

## Storage and portability

SQLite through Node's built-in node:sqlite persists records, decisions and collection runs in .data/tracker.sqlite. This is a local single-server demo, not a production database architecture. node:sqlite is experimental in the supplied Node 24 runtime. TRACKER_DB overrides the path.

The local session signing key is created in .data/session-key. Never share that file. The .data folder, environment secrets, dependencies and generated build files are excluded by .gitignore.

For an explicit manager-demo setup only:

    node --import tsx scripts/curate-demo.ts

This publishes up to three pending records in each category, records a demo-only rationale, and replaces only unreviewed reference duplicates with fetched official records. It does not run automatically.

To expand an existing locally collected database for the chart demonstration:

    node --import tsx scripts/curate-chart-demo.ts

This selects a bounded sample by publication month from existing public records, records each demo-only approval, and creates no synthetic regulatory actions. It is forbidden in production and never runs at startup.

## Verification

    npm test
    npm run typecheck
    npm run build
    npm run test:browser

Unit/integration tests cover approval visibility, stale decisions, changed evidence, unchanged sources, invalid data, signature tampering/expiry, production rejection, original-versus-supplement approval labels and parser failures. Browser tests use a fresh, isolated database, never the manager preview database.

## Remaining work

Real account signup/login and a hosted deployment are the next practical steps. More comprehensive Warning Letter/Form 483 pagination and drug-approval retrieval can follow if needed. Investigator scoring, AI agents, global regulators and the earlier 54-screen architecture are outside this app's requested scope.

## Hosted manager preview

Production homepage role choices open a separate public manager preview. It includes 105 public-source snapshot records, charts, filters and tab-only sample editorial decisions. Live collection is disabled. No Vercel environment variables are required for this preview. Server demo login remains disabled in production. See DEPLOYMENT.md for the distinction between this demonstration and real hosted accounts/storage.

