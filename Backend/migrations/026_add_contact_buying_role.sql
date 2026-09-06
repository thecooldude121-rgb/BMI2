-- Migration 026: a buying role on contacts.
--
-- Reference: CLAUDE.md Phase-1 page list, item 3 — "account detail, related
-- deals, account team (champion / decision-maker / influencer / blocker),
-- buying committee map".
--
-- WHY
-- The account team is a named Phase-1 deliverable and there was no column to
-- store it. EnhancedAccountDetailView filled the gap twice, both times by
-- inventing the value: first by ARRAY INDEX (contact 0 was always the decision
-- maker, contact 1 always the champion), and after that was removed, by
-- hardcoding every contact to 'influencer'. Both read as real data on a page
-- whose contacts genuinely come from the database. This column is the honest
-- source, and the reason the fallback is being deleted rather than kept.
--
-- WHY NULLABLE WITH NO DEFAULT
-- An unset role must render as unknown, not as a role nobody assigned. A
-- DEFAULT 'influencer' would recreate the exact defect this replaces — a
-- fabricated attribute grafted onto a real record — just one layer lower, in
-- the schema, where it would look authoritative. All 20 existing contacts start
-- NULL and stay NULL until a user assigns a role through the UI.
--
-- NO BACKFILL, DELIBERATELY
-- There is no source to backfill from. contacts.position holds a job title
-- ('VP Sales'), which is not a buying role: a VP Sales can be the champion on
-- one deal and the blocker on another. Inferring one from the other would be
-- fabrication with an extra step.
--
-- WHY THIS VOCABULARY
-- It matches config/contactRoles.ts and the role values already persisted in
-- deals.stakeholders (champion, decision-maker, economic-buyer,
-- technical-evaluator, legal-procurement). The deal-level committee and the
-- account-level team therefore speak one language, and utils/dealCommittee.ts
-- works against both without a translation layer. 'blocker' is named in the
-- CLAUDE.md deliverable and is added here; 'influencer' and 'end-user' come
-- from contactRoles.ts.
--
-- NOTE ON SCOPE
-- The role is a property of the contact's relationship to their ACCOUNT. A
-- per-deal role already exists in deals.stakeholders and is not replaced by
-- this. The two are different questions and both are real.

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS buying_role VARCHAR(32);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_buying_role_check'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_buying_role_check
      CHECK (buying_role IS NULL OR buying_role IN (
        'champion',
        'decision-maker',
        'economic-buyer',
        'technical-evaluator',
        'legal-procurement',
        'influencer',
        'end-user',
        'blocker'
      ));
  END IF;
END $$;

-- "Who on this account holds a buying role" is the only read pattern. Partial,
-- because the overwhelming majority of rows are NULL and are never the subject
-- of the query.
CREATE INDEX IF NOT EXISTS idx_contacts_buying_role
  ON contacts (tenant_id, company_id, buying_role)
  WHERE buying_role IS NOT NULL;

COMMENT ON COLUMN contacts.buying_role IS
  'Buying role on the parent account. NULL means unassigned and must render as '
  'unknown, never as a default role — see migration 026.';
