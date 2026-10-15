# GitHub and Vercel

## Current release boundary

This repository contains the independent FDA Tracker homepage and local manager demonstration. The production build passes, but a hosted, usable dashboard is not implemented yet. Production deliberately disables direct Admin/User demo login.

The local SQLite database, collection history, editorial decisions and session signing key are excluded from Git. The 89 locally published demonstration records will not appear after cloning or deploying. Six public reference examples are included in source; they start pending when a local database is initialized.

## Import into Vercel

1. In your Vercel account, choose Add New → Project and import `webseotools007/fdatracker` from GitHub.
2. Use the repository root as Root Directory and the detected Next.js framework.
3. Select Node.js 24.x. Keep the build command `npm run build` and the default Next.js output settings. Use `npm ci` for installation.
4. Deploy the homepage preview and review the build logs. No environment variables are needed for the homepage. Do not enable public demo Admin access.

A successful local build does not verify a Vercel deployment. The site has not been deployed merely by pushing to GitHub.

## Before enabling the hosted dashboard

- Replace local SQLite storage with a hosted persistent database and migrate the stored records, decisions and collection history intentionally. Vercel function storage must not be treated as a durable database; putting SQLite in temporary storage is not a persistence solution.
- Implement real authentication and server-authorized administrator accounts. Keep the production restriction on local demo sessions until that replacement is complete.
- Use deployment environment secrets for signing credentials; do not commit `.data/session-key` or environment files.
- Configure collection jobs for hosted execution, then verify official-source requests, error reporting, editorial review and approved-only customer visibility on that deployment.
- Verify login, restart persistence, separate user/admin access, source collection and charts before sharing a hosted dashboard as functional.

The current four manual connectors and bounded coverage remain documented in README.md. A deployed homepage does not establish live official-data coverage.
