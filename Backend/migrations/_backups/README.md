# Deleted-row backups

Restorable `INSERT` statements for rows removed from live `bmi_crm` during the
2026-09-16 test-data cleanup. Kept in the repository so a deletion is
recoverable rather than final — the rows carried nonzero deal values, and a
backup beside the deletion is the difference between "reversible" and "gone".

| File | What it holds | Removed |
|---|---|---|
| `D053_demo_company_row.sql` | deal D053 "Demo Company", USD 300,000 | migration 053 |
| `D042_D043_dlj22yl_deal_rows.sql` | deals D042 + D043 (Moving Walls) and dlj22yl (Zenith Corp) | direct, 2026-09-16 |
| `D043_test_upload_document_row.sql` | the `test-upload-deal` document that was attached to D043 | direct, 2026-09-16 |

## Restoring

These are plain `INSERT`s produced by `pg_dump --column-inserts`, so they can be
replayed as-is. Two caveats:

1. **The document's FILE is not here — only its row.** The blob was removed
   through the application's own `deleteFile(storage_key)`, the same call
   `deleteDocuments` makes, so restoring the row would produce a record pointing
   at bytes that no longer exist. It was a 1,381-byte file named
   `test-upload-deal`; it is not worth reconstructing.
2. **Do not replay these to recreate Moving Walls or Zenith as working deals.**
   Those two are being re-entered through the application's New Deal form so
   they get a correct sequence id, tenant, currency and `company_id` like every
   other genuine deal. `dlj22yl` in particular carried a client-minted id from
   before migration 031 wired `deals.id` to a sequence — replaying it would put
   that malformed id straight back.

## `ZZ_audit_test_debris_rows.sql` — deleted 2026-10-03

Stray audit/verification debris in the live workspace, deleted on Venkat's
explicit approval after checking nothing real referenced it: deals **D055**
"ZZ Audit Test Deal" and **D056** "Copy of ZZ Audit Test Deal", plus D055's three
dependents, each itself labelled as test data — task **T016** ("please delete"),
meeting **MTG001** ("Please delete"), and document `zz_audit_doc`.

- Checked before deleting: every FK into `deals` (activities, deal_stage_history,
  quotes, sales_orders — 0 rows), the polymorphic references (tasks, documents,
  meetings — exactly the three above), and a scan of every text/jsonb column for
  the ids or the name (nothing else).
- Each statement recreates its row exactly (`json_populate_record`); restore deals
  before dependents. Verified restorable inside a rolled-back transaction.
- **The document's file is not here.** It was deleted through the documents API,
  which removes the stored blob (1,134-byte PNG).

## `ZZ_xss_probe_lead_and_audit_view_rows.sql` — deleted 2026-10-03

Lead **53** (`ZZ <img src=x onerror="window.__xss=1"> Edge 😀 Tést`, a stored-XSS
probe) and lead view **"ZZ Audit view"**, deleted on Venkat's approval.

- **Before deleting, the probe was verified to render SAFELY:** no
  `dangerouslySetInnerHTML` / `innerHTML` / `insertAdjacentHTML` / `document.write`
  / `srcDoc` / `javascript:` sink exists in the frontend, and a headless Chromium
  run through the real login showed the name as literal text on the Kanban view,
  the searched list and `/crm/leads/53`, with the payload's marker never set and no
  `<img>` injected. A control run that injected the same payload AS HTML did set
  the marker, so the detector works. Not a vulnerability; test debris.
- Dependency trace: every FK into `leads` (deals, activities, lead_notes,
  lead_tasks, lead_emails, lead_calls, lead_meetings, lead_stage_history) — 0 rows;
  polymorphic tasks / documents / meetings — 0; nothing references `lead_views`; a
  text/jsonb scan for the email, the payload and the view id found only the rows
  themselves.
- Deleted through the API; restorable, verified in a rolled-back transaction.

## `ZZ_leads_51_52_rows.sql` — deleted 2026-10-03

Leads **51** "ZZ Audit Test Lead" and **52** "ZZ Import Valid", test debris, deleted
on Venkat's approval. Same trace as lead 53: every FK into `leads`, the polymorphic
tasks / documents / meetings, and a text/jsonb scan for both emails and names —
nothing but the rows themselves. Deleted through the API; restorable, verified in a
rolled-back transaction. No `ZZ` lead remains in the live workspace.

## `step4_owner_probability_company_before.sql` — values before migration 061 (2026-10-03)

Prior values of every row migration 061 changed on the live workspace: the 38 leads
whose owner name named nobody, and all 15 seeded deals (owner name, probability and
company_id). Running the file restores those columns exactly. 061 cleared the
non-user owner names to NULL, reset 12 seeded probabilities that had no reason to the
stage default, and linked D006 -> C006 and D010 -> C010. Approved by Venkat.

## `ZZ_draft_deal_D057_row.sql` — deleted 2026-10-03

D057 "ZZ Draft deal", test debris, deleted on approval. Nothing referenced it (every FK
into `deals`, the polymorphic tasks / documents / meetings, a text/jsonb scan).
Deleted through the API; restorable, verified in a rolled-back transaction. No `ZZ`
deal remains.
