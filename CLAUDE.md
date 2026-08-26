# BMI2 CRM

Full-stack CRM: React + Vite frontend (`Frontend/`), Express + PostgreSQL backend
(`Backend/`), database `bmi_crm`. The backend serves `http://localhost:5001/api/v1`;
the frontend dev server runs on `:5173`.

The codebase is mid-remediation. Large parts of the UI were built over fixtures and
`console.log` handlers, and the ongoing work is converting them to real data or
marking them honestly. See the session memory index for phase-by-phase state.

## The governing principle

A disabled control tells a user a feature isn't ready. A success toast tells them
their data is safe. This codebase did the second in hundreds of places.

Never make the product claim something that isn't true. That includes:

- no fabricated numbers, scores, or trends where no query backs them
- no success message for a write that did not happen
- absent data renders as absent (`—`, "not recorded"), never as `0` or a plausible default
- a failed request must never render as a zero — say which part failed
- a weak or best-effort join must say so, rather than printing a confident count

Unfinished surfaces render `components/common/NotAvailable.tsx`, or carry a
`PREVIEW · SAMPLE CONTENT` label if the shape is worth showing.
`grep -rl NotAvailable Frontend/src` is the live inventory of what is unfinished.

## Working style

**Verify the route the nav actually opens, not the file you edited.** Phase 3 (12/n)
put `pages/Dashboard.tsx` on real data and verified it at `/dashboard` — but
`components/Layout/Sidebar.tsx` links "Dashboard" to `/crm/dashboard`, a different
1,043-line file still full of literals. The fix was correct and invisible for three
commits, and the user was looking at fabricated numbers the whole time. Before
claiming a page is fixed, click through the app the way a user would and confirm the
route the sidebar opens is the one you changed.

**Check the network response before reporting a failure.** Twice I reported the
Accounts page as "0 accounts / could not load deals" and treated it as a bug. It
wasn't: the network log showed every request returning 200. I had screenshotted
before the fetch resolved. Read the actual response (`read_network_requests`, or a
direct `fetch` in the page context) before diagnosing a load failure from a
screenshot — and wait for the request to settle before asserting what a page shows.

**Corollary to both: prefer a check over an inference.** A grep that "looks right"
is not a result. Two examples from one session: a reachability grep reported every
file as having zero importers, which nearly led to deleting `DealsListView` — it is
imported by the routed deals board. And there are three sibling `DealDetailPage.tsx`
files; only one is unreferenced. Resolve imports to actual paths before deleting
anything.

## Verification expectations

- Verify against the live API **and** cross-check with SQL. Then verify in the
  browser — several defects have only been visible there.
- Snapshot data as text before a type or schema conversion, and diff after.
- After any schema change, run the fresh-install check: migrate a virgin database
  and diff its schema against live across every column.
- Clean up verification accounts and test rows **in the same session that creates
  them**. Several "test data" records removed later were left behind by earlier
  verification runs.

## Hard rules learned from real bugs

- **`pg_constraint` is the authority for every vocabulary**, never prose or a TS type.
- **All timestamp columns are `timestamptz`** (migration 021). Never write `TIMESTAMP`
  in a new migration — a naive column silently drops the offset from a client ISO
  string. `runMigrations` warns on boot if one reappears.
- **Array columns are `text[]`**, never delimited text.
- **Bulk actions are one transactional endpoint**, never N requests from the browser.
  Report what the server did, not what the user selected.
- **The server owns generated ids** (`C001`/`CT001`/`D001` style).
- **`?? undefined` beats `|| 0` for anything fetched.** `|| 0` collapses "not loaded"
  into "none" and prints a confident zero.
- Postgres resolves one type per parameter — don't reuse a placeholder in two
  contexts. And never put a backtick inside SQL in a JS template literal.

## Commands

```
cd Frontend && npm run dev            # :5173
cd Backend  && npm run dev            # :5001
cd Backend  && npm run db:migrate     # migrations (DB_NAME overrides the database)
cd Frontend && npx vitest run         # tests
cd Frontend && npx tsc -p tsconfig.app.json --noEmit   # typecheck
```

Counting type errors: redirect to a file and grep — `$(...)` substitution returns 0
unreliably. "Real" errors exclude `TS6133`/`TS6192`/`TS6198` (unused symbols).
