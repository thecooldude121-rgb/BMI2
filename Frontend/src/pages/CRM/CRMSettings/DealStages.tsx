import React from 'react';
import PipelineSettings from './PipelineSettings';

/**
 * Deal Stages — now the real stage editor.
 *
 * THREE SCREENS WERE INVENTING THREE DIFFERENT STAGE LISTS, and none of them
 * matched the database or each other:
 *
 *   PipelineSettings   PROSPECTING / QUALIFIED / PROPOSAL / NEGOTIATION,
 *                      plus an "avg days" column with no column behind it
 *   DealStages         Qualification / Needs Analysis / Proposal /
 *                      Negotiation / Closed Won        (this file)
 *   StageProbabilities the same five, read-only
 *
 * The workspace's actual stages are Prospecting / Qualified / Proposal /
 * Negotiation / Closed Won / Closed Lost. So an admin opening "Deal Stages" saw
 * a list containing "Needs Analysis", a stage that has never existed here, and
 * every control on it changed local React state and nothing else.
 *
 * All three nav entries now render the one screen that talks to
 * `/api/v1/pipelines/:id/stages`. Kept as separate files rather than collapsed
 * into one nav item because the sidebar is shared UI and removing entries is a
 * navigation change, not a stage-configuration one — the entries stay, they
 * simply lead somewhere true.
 */
const DealStages: React.FC = () => <PipelineSettings />;

export default DealStages;
