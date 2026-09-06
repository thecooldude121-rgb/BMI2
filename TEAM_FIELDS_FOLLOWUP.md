# Follow-up — the member fields that have no column

**Status: a decision to make, not work in progress.** Nothing here is built.

Settings → Team Management ran on a 44-field fabricated model
(`teamManagementMockData.ts`, 958 lines). `GET /users` returns nine columns. The
page read twenty of the forty-four; the wiring in checkpoint 2 kept the seven
that are real and labelled the thirteen that were invented.

This records which of the absent fields look worth a schema addition, so the
question is answered deliberately rather than by whoever next needs one.

## Probably worth adding

| Field | Why | Cost |
|---|---|---|
| `phone` | Every CRM has it, the page had a phone row, and it is the field most likely to be asked for first. | `ALTER TABLE users ADD COLUMN phone VARCHAR(50)`, plus a field on the profile form. |
| `job_title` | Distinct from `role`: role is permissions, job title is what a person does. The page showed both and conflated them. | One nullable column, one form field. |
| `manager_id` | Would make the reporting lines real. **Not free** — a self-referencing FK, a cycle guard, and a decision about what happens to reports when a manager is deactivated. | A column plus real rules; the largest of the three. |

## Probably not

- **`employee_id`** — an HR identifier. `employees` belongs to HRMS, which is a
  separate platform behind the SSO boundary (CLAUDE.md's open architecture
  question). Adding it here would quietly duplicate HRMS data in the CRM.
- **Login analytics** (`totalLogins`, `averageLoginsPerWeek`, `loginFrequency`,
  `failedLoginAttempts`) — needs a login-events table, not a column, and no
  feature asks for it. `last_login_at` already exists and covers the common
  question.
- **`permissionSet` / `permissionsLevel`** — the role IS the permission model
  (`utils/permissions.ts`, and `requireRole` server-side). A second, free-text
  permissions field would be a competing source of truth.
- **`location` / `timezone` per member** — the workspace has a timezone
  (migration 035). A per-member one is only worth it if scheduling needs it.
- **`accountLocked`** — implies a lockout mechanism that does not exist. The
  rate limiter throttles by IP and email, not by account.
- **`emailVerified`** — meaningless until email delivery is configured. Related:
  `PATCH /auth/me` changes an address with no confirmation step, for exactly
  that reason.

## Derived, not missing

`initials` and `avatarColor` are computed in `usersApi.ts` from the name and the
id. That is not the same as fabricating: they carry no information that is not
already true. A stock photo or an invented job title would.

## Per-member deal statistics

Active deals, pipeline value, assigned contacts and open tasks are currently
labelled `NotAvailable` on the member card. These need **no new columns** —
`deals`, `contacts` and `tasks` all record an owner. What they need is a rollup
endpoint (`GET /users/:id/stats`, or counts folded into `GET /users`), plus a
decision about the cost of computing them for every member on every page load.
Of everything on this list, this is the one that is genuinely just work rather
than a modelling question.
