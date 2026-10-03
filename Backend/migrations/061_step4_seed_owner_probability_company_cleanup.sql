-- Migration 061: step 4 data fixes on the live workspace. Approved 2026-10-03 (Venkat).
--
-- Every statement is scoped to the live workspace id AND guarded by the exact
-- condition it corrects, so it is a no-op in any other database (the test DB,
-- a fresh one) and a no-op if run twice. The prior values of every row touched
-- are in migrations/_backups/step4_owner_probability_company_before.sql, which
-- restores them exactly.

-- ── A. Owner names that name nobody → unassigned ───────────────────────────
-- "John Smith" (22 leads, 15 deals), "Sarah Lee", "Emily Chen", "Michael Torres":
-- seeded owner names matching no user in the workspace. Showing them names a
-- person who does not exist. Cleared to NULL — an honest "Unassigned".
-- Guarded: only seeded rows, only these names, only where no user matches.
UPDATE leads l
   SET assigned_to = NULL, updated_at = NOW()
 WHERE l.tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b'
   AND l.is_seed
   AND l.assigned_to IN ('John Smith', 'Sarah Lee', 'Emily Chen', 'Michael Torres')
   AND l.assigned_to_user_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM users u
                    WHERE u.tenant_id = l.tenant_id
                      AND (u.first_name || ' ' || u.last_name) = l.assigned_to);

UPDATE deals d
   SET assigned_to = NULL, updated_at = NOW()
 WHERE d.tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b'
   AND d.is_seed
   AND d.assigned_to = 'John Smith'
   AND d.assigned_to_user_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM users u
                    WHERE u.tenant_id = d.tenant_id
                      AND (u.first_name || ' ' || u.last_name) = d.assigned_to);

-- ── B. Probabilities with no reason → the stage default ────────────────────
-- 12 seeded deals (D001-D004, D007, D008, D010-D015) stored a probability that
-- differed from their stage's default with no override reason — seed
-- randomness (win_prob_ai is 0 on all of them; none carries the removed
-- heuristic's boost). A probability now always has a reason: the stage
-- default, or a rep's override WITH a reason.
UPDATE deals d
   SET probability = ps.probability, updated_at = NOW()
  FROM pipeline_stages ps
 WHERE ps.id = d.stage_id
   AND ps.tenant_id = d.tenant_id
   AND d.tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b'
   AND d.is_seed
   AND d.win_prob_override_reason IS NULL
   AND ps.probability IS NOT NULL
   AND d.probability IS DISTINCT FROM ps.probability;

-- ── C. The two domain near-misses → their companies ────────────────────────
-- D006 (lead domain manufact.com vs company manufactpro.com) and D010
-- (automatedge.com vs automedge.com) — the pair CLAUDE.md held back for a human
-- decision; decided: same company. Literal pairs, re-checked by company name.
UPDATE deals SET company_id = 'C006', updated_at = NOW()
 WHERE id = 'D006' AND tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b' AND company_id IS NULL
   AND EXISTS (SELECT 1 FROM companies WHERE id = 'C006'
                AND tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b' AND name = 'ManufactPro');

UPDATE deals SET company_id = 'C010', updated_at = NOW()
 WHERE id = 'D010' AND tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b' AND company_id IS NULL
   AND EXISTS (SELECT 1 FROM companies WHERE id = 'C010'
                AND tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b' AND name = 'AutomEdge');
