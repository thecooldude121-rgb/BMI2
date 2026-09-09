# Frontend typecheck — the real gate, and its backlog

## `npx tsc --noEmit` AT THE FRONTEND ROOT CHECKS NOTHING

`Frontend/tsconfig.json` is a solution-style config: `"files": []` plus two project
references. Run without `-b` or `-p`, `tsc` therefore compiles an empty file list, prints
nothing, and exits 0. **It is a no-op that looks exactly like a clean pass.**

I reported "tsc clean, 0 errors" for the frontend across several commits on the strength of
that command. Those reports were vacuous. The backend's `npx tsc --noEmit` is genuine — its
tsconfig has a real `include` — so only the frontend claims were empty.

Use instead:

```
cd Frontend && npm run typecheck        # tsc -p tsconfig.app.json --noEmit
cd Frontend && npm run typecheck:count  # just the number
```

## Baseline: 229 errors at HEAD (2026-09-10)

Lowered from 281 (357be5a). The gate only fails on a RISE, so a stale-high baseline
quietly stops protecting anything — CI emits a notice asking for the number to be lowered
whenever a build comes in under it, and this is that number being kept.

Lowered again from 240 by ReportsPage phase (b): 11 more `TS6133`
unused-declaration errors went with the dead export handlers, no-op modals,
decorative filters and three unreachable empty-state components that were
deleted there. Every one of them had been sitting in the "noise" bucket while
marking a control that did nothing.

The 9 before that came off in the Team-pages rewiring: they were all `TS6133`
unused-declaration errors in `TeamMemberDetailPage`, and every one marked genuinely dead
code — handlers, permission flags and helpers left behind by fabricated sections that had
been deleted. That is the case for triaging by reachability rather than by error code: the
"noise" codes were pointing at the dead surface the whole time.

This is a **pre-existing backlog**, not damage from the pipeline-stage work — measured by
stashing and re-running against a clean tree. It is recorded so a regression is visible as
a number going up, rather than being lost in noise.

Heaviest files at the baseline:

```
 29  pages/CRM/DealsListView.tsx
 27  pages/CRM/DocumentDetailPage.tsx
 17  pages/CRM/DocumentsLibrary.tsx
 16  pages/CRM/DealsKanbanPage.tsx
 15  pages/CRM/ReportsPage.tsx
 10  pages/Team/TeamMemberDetailPage.tsx
 10  pages/Settings/RolesManagement.tsx
  9  pages/CRM/AccountsPage.tsx
```

**Triage by REACHABILITY, never by error code** — CLAUDE.md lesson 6. Type errors in this
project have twice concealed live user-facing bugs (`AccountFormPage` reading
`account.address` when the field is `billingAddress`; `login()` returning an object where a
boolean was expected, so every failed sign-in looked successful). A large share of the 281
are `TS6133`/`TS6198` unused-variable noise, and that is exactly the code this project has
been burned by dismissing: `TS6198` is what would have caught `GamificationPage`
destructuring a context it never read.

## The rule going forward

**A change is not "tsc clean" unless `npm run typecheck` was run and the count did not rise
above the baseline.** Update the number in this file when it legitimately drops, and say so
in the commit.
