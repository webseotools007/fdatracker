# GitHub and Vercel

## Current release boundary

This repository contains the independent FDA Tracker homepage and local manager demonstration. Production includes a separate public manager preview at `/preview?role=user` and `/preview?role=admin`. The homepage role choices open this preview on Vercel. It uses a bundled snapshot of 105 public-source records (89 approved demonstration examples and 16 pending examples), not the server SQLite database. Charts use the snapshot date, 2026-10-15. Search, categories, date filtering, pagination and record details work; sample editorial changes persist only in sessionStorage in the same browser tab. Source collection is disabled. Every snapshot record is public, including pending samples; the preview is not an access-control boundary. Production server authentication and writes remain disabled.

The local SQLite database, collection history, editorial decisions and session signing key are excluded from Git. The local database is not uploaded. Six public reference examples are included for local initialization. A separate, sanitized public-source snapshot powers the hosted preview; no decision history or signing key is included.

## Import into Vercel

1. In your Vercel account, choose Add New → Project and import `webseotools007/fdatracker` from GitHub.
2. Use the repository root as Root Directory and the detected Next.js framework.
3. Select Node.js 24.x. Keep the build command `npm run build` and the default Next.js output settings. Use `npm ci` for installation.
4. Deploy the homepage preview and review the build logs. No environment variables are needed for the homepage or public manager preview. Do not enable public demo Admin access.

A successful local build does not verify a Vercel deployment. The site has not been deployed merely by pushing to GitHub.

## Before enabling the hosted dashboard

- Replace local SQLite storage with a hosted persistent database and migrate the stored records, decisions and collection history intentionally. Vercel function storage must not be treated as a durable database; putting SQLite in temporary storage is not a persistence solution.
- Implement real authentication and server-authorized administrator accounts. Keep the production restriction on local demo sessions until that replacement is complete.
- Use deployment environment secrets for signing credentials; do not commit `.data/session-key` or environment files.
- Configure collection jobs for hosted execution, then verify official-source requests, error reporting, editorial review and approved-only customer visibility on that deployment.
- Verify login, restart persistence, separate user/admin access, source collection and charts before sharing a hosted dashboard as functional.

The current four manual connectors and bounded coverage remain documented in README.md. A deployed homepage does not establish live official-data coverage.
