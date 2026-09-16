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
