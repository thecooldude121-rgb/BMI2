# CRM Engine — Engineering & Product Design Specification

*Data Model · API & Integration Bus Contracts · Sprint-Ready User Stories · UI Wireframes*

Companion to the BMI Platform Comprehensive Strategic & Product Blueprint, Section 5

July 2026

# 1. Purpose & How to Use This Document

The earlier blueprint documents established what to build and why. This document makes the CRM Engine buildable: the actual data model, the API and event contracts the module must expose and consume, a first batch of sprint-ready user stories with acceptance criteria, and low-fidelity wireframes for the three highest-priority pages.

This is a starting kit, not a finished spec — it's scoped to get engineering, product, and design moving in the same direction on the CRM Engine specifically. The same treatment (schema, API contracts, stories, wireframes) should be repeated for Lead Generation, AI Meeting Agent, Customer Success, and the remaining modules before they enter a sprint.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Still needed before full sign-off</strong></p>
<p><em>Visual design system (exact colors/type/spacing tokens), specific ML model selection and training-data plan for scoring/forecasting, and vendor selection for transcription, enrichment, and telephony are intentionally out of scope here — they're cross-module decisions covered separately, not CRM-specific.</em></p></td>
</tr>
</tbody>
</table>

# 2. Data Model & Schema

All entities are tenant-scoped: every table carries a tenant_id used to enforce the isolation model described in the Trust & Compliance Console (row-level security at the database layer, validated again at the application layer on every query).

## 2.1 Core Entities Overview

| **Entity**         | **Purpose**                                                     | **Owned By**                                             |
|--------------------|-----------------------------------------------------------------|----------------------------------------------------------|
| Account            | Company-level operating record                                  | CRM Engine                                               |
| Contact            | Person-level relationship record, linkable to multiple Accounts | CRM Engine                                               |
| Lead               | Pre-qualification record prior to conversion                    | CRM Engine (sourced from Lead Gen)                       |
| Deal (Opportunity) | Revenue opportunity tied to an Account                          | CRM Engine                                               |
| DealStageHistory   | Immutable audit trail of every stage transition                 | CRM Engine                                               |
| Activity           | Task, call, email, meeting, or note tied to any core record     | CRM Engine (many auto-captured)                          |
| AISuggestion       | Pending AI-proposed change awaiting human review                | CRM Engine (shared pattern, Section 18 of the Blueprint) |
| ForecastSnapshot   | Point-in-time forecast record for audit trail                   | Revenue Intelligence Layer, cached in CRM                |
| Pipeline / Stage   | Tenant-configurable pipeline definition                         | CRM Engine (Automation Studio manages transition rules)  |
| User / Role        | Identity and permission record                                  | Platform Identity Layer (referenced, not owned, by CRM)  |

## 2.2 Key Relationships

| **Relationship**            | **Cardinality** | **Notes**                                                                    |
|-----------------------------|-----------------|------------------------------------------------------------------------------|
| Account → Deal              | 1 : many        | A deal always has exactly one primary Account                                |
| Account ↔ Contact           | many : many     | Via a link table, to support advisors/investors linked to multiple accounts  |
| Deal → Activity             | 1 : many        | Polymorphic relation shared with Account, Contact, and Lead                  |
| Deal → DealStageHistory     | 1 : many        | Append-only; never updated or deleted, only inserted                         |
| Lead → Deal                 | 1 : 0..1        | Populated only after conversion; Lead is retained, marked “converted”        |
| AISuggestion → (any entity) | many : 1        | Polymorphic target_type / target_id; always references a source_evidence_ref |
| Deal → Pipeline/Stage       | many : 1        | Stage set is tenant-configurable; not hardcoded in application logic         |

## 2.3 Field-Level Detail — Primary Entities

Standard audit fields (id, tenant_id, created_at, updated_at, created_by, updated_by) are omitted from every table below to save space — assume every entity has them.

### Deal

| **Field**                               | **Type**                            | **Notes**                                                |
|-----------------------------------------|-------------------------------------|----------------------------------------------------------|
| name                                    | string                              | Required                                                 |
| account_id                              | UUID (FK Account)                   | Required                                                 |
| primary_contact_id                      | UUID (FK Contact)                   | Nullable                                                 |
| owner_id                                | UUID (FK User)                      | Required                                                 |
| pipeline_id / stage                     | UUID (FK Pipeline) / enum           | Stage set is tenant-configurable                         |
| amount / currency                       | decimal / string(3)                 | Required                                                 |
| recurring_revenue / one_time_fee        | decimal                             | Nullable, sum need not equal amount (discounts)          |
| probability                             | decimal (0–1)                       | System-computed by the ML model; never manually editable |
| health_score                            | decimal (0–100)                     | Computed; cached from the Revenue Intelligence layer     |
| expected_close_date / actual_close_date | date                                | actual_close_date null until closed                      |
| status                                  | enum: open, closed_won, closed_lost | Required                                                 |
| source_lead_id                          | UUID (FK Lead)                      | Nullable                                                 |
| tags                                    | array\<string\>                     | Free-form, validated against tenant Tag taxonomy         |
| stage_entered_at                        | timestamp                           | Reset on every stage change; powers time-in-stage        |

### Account

| **Field**                | **Type**               | **Notes**                                                          |
|--------------------------|------------------------|--------------------------------------------------------------------|
| name / industry / region | string / string / enum | Required                                                           |
| parent_account_id        | UUID (FK Account)      | Nullable; supports hierarchy                                       |
| owner_id                 | UUID (FK User)         | Required                                                           |
| health_score             | decimal (0–100)        | Read-only cache from Customer Success module; never written by CRM |
| renewal_date             | date                   | Nullable; synced from Customer Success                             |

### Contact

| **Field**                      | **Type**               | **Notes**                                                |
|--------------------------------|------------------------|----------------------------------------------------------|
| first_name / last_name / email | string                 | Email unique per tenant                                  |
| title / department / seniority | string / string / enum | Seniority: C-suite, VP, Director, Manager, IC            |
| primary_account_id             | UUID (FK Account)      | Required                                                 |
| influence_level                | enum                   | Champion, decision-maker, blocker, influencer, unknown   |
| consent_status                 | enum                   | Feeds the Trust & Compliance Console consent center      |
| relationship_score             | decimal                | Computed: recency, responsiveness, meeting participation |

### Lead

| **Field**                                                       | **Type**       | **Notes**                                                            |
|-----------------------------------------------------------------|----------------|----------------------------------------------------------------------|
| source                                                          | enum           | inbound, outbound, referral, event, lead-gen-module                  |
| status                                                          | enum           | new, contacted, qualified, converted, disqualified                   |
| fit_score / intent_score / freshness_score                      | decimal        | Populated by the Lead Generation Directory                           |
| owner_id                                                        | UUID (FK User) | Required                                                             |
| sla_due_at                                                      | timestamp      | Drives SLA-timer alerts                                              |
| qualification_fields                                            | JSON           | Tenant-configurable minimal field set (Section 5.1 of the Blueprint) |
| converted_deal_id / converted_account_id / converted_contact_id | UUID (FK)      | Null until conversion                                                |

### Activity

| **Field**                       | **Type**    | **Notes**                                                                     |
|---------------------------------|-------------|-------------------------------------------------------------------------------|
| type                            | enum        | call, email, meeting, task, note                                              |
| related_to_type / related_to_id | enum / UUID | Polymorphic reference to Deal, Account, Contact, or Lead                      |
| owner_id / status               | UUID / enum | Status: open, completed, overdue                                              |
| due_at / completed_at           | timestamp   | Nullable as appropriate                                                       |
| source                          | enum        | manual, auto-captured-email, auto-captured-calendar, meeting-agent, telephony |
| quality_score                   | decimal     | Nullable; used to avoid gamifying activity volume over outcomes               |

### AISuggestion

| **Field**                 | **Type**         | **Notes**                                                   |
|---------------------------|------------------|-------------------------------------------------------------|
| target_type / target_id   | enum / UUID      | Polymorphic — which record this suggestion would change     |
| suggestion_type           | enum             | field_update, next_best_action, follow_up_draft, risk_flag  |
| payload                   | JSON             | Proposed change, in the same shape as the target field(s)   |
| confidence_score          | decimal (0–1)    | Required; drives the review-queue threshold                 |
| source_evidence_ref       | UUID / URL       | Points to the transcript, email, or record used as evidence |
| status                    | enum             | pending, accepted, edited_and_accepted, rejected            |
| reviewed_by / reviewed_at | UUID / timestamp | Null until a human responds                                 |

### DealClosingBrief (new)

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Why this exists alongside the Meeting Agent's Conversation Intelligence Dashboard</strong></p>
<p><em>That dashboard (specified in the AI Meeting Agent document) answers a team-wide question: which reps and calls need coaching attention right now. This entity answers a different, deal-specific question a rep asks constantly: how do I close this one deal. It is generated by reading across every Meeting Agent transcript/summary/objection linked to a single deal, the deal's own CRM activity history, and the Sales Enablement win/loss pattern library — then synthesizing all of it into one brief. It does not duplicate storage from any of those sources; it is a generated, cacheable read-model built by querying them.</em></p></td>
</tr>
</tbody>
</table>

| **Field**                    | **Type**           | **Notes**                                                                                                                                                            |
|------------------------------|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| deal_id                      | UUID (FK Deal)     | 1:1 with the Deal it briefs; regenerated on demand or when new conversation data arrives                                                                             |
| conversation_digest          | JSON array         | One entry per meeting/email tied to this deal, each with date, type, and a one-line synthesized takeaway, sourced from the Meeting Agent's MeetingSummary records    |
| objection_ledger             | JSON array         | Every distinct objection raised across every call for this deal, with mention count, first/last raised date, and resolution status (unresolved, resolved, open_risk) |
| recommended_next_action      | JSON               | A single synthesized action (not a list) with a confidence score and the specific evidence it was derived from                                                       |
| similar_deals_ref            | array\<UUID\>      | Closed-Won deals matched by industry, size, and objection-pattern similarity, from the Sales Enablement win/loss library                                             |
| recommended_content_refs     | array\<UUID\>      | Content recommendations tied to the deal's stage and the objections still open                                                                                       |
| closing_readiness_score      | decimal (0–100)    | Explainable composite of deal health, sentiment trend across calls, and objection-resolution completeness — never a black-box number                                 |
| model_version / generated_at | string / timestamp | —                                                                                                                                                                    |

# 3. API Contracts & Integration Bus Specification

## 3.1 Authentication & Tenant Context

- OAuth 2.0 / OIDC via the shared Platform Identity Layer; every request carries a Bearer JWT.

- The JWT includes tenant_id and role claims; the API gateway rejects any request whose tenant_id does not match the resource being accessed, before the request reaches CRM application code.

- Service-to-service calls (e.g., Automation Studio acting on a workflow) use scoped service tokens, never a impersonated user token.

## 3.2 REST Conventions

- Base path: /api/v1/crm/... ; breaking changes require a new major version (/v2/), with the prior version supported for a published deprecation window.

- Pagination: cursor-based (?cursor=...&limit=...), not offset-based, to stay stable while records are being written concurrently.

- Errors: a standard envelope — { "error": { "code", "message", "details" } } — with HTTP status codes used consistently (400 validation, 403 tenant/permission mismatch, 404 not found, 409 conflict, 429 rate-limited).

- Idempotency: POST/PATCH requests that create or transition state accept an Idempotency-Key header so retried requests (e.g., from a flaky mobile connection) don't double-create records.

- Rate limits: enforced per tenant and per API key, with limits surfaced in X-RateLimit-Limit / X-RateLimit-Remaining response headers.

## 3.3 Core Endpoints

| **Method & Path**                      | **Purpose**                                      | **Notes**                                                                                                      |
|----------------------------------------|--------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| GET /deals                             | List deals with filters                          | Filters: stage, owner, amount range, health_score, tag, updated_since                                          |
| POST /deals                            | Create a deal                                    | Validates required fields per tenant's minimal-field configuration                                             |
| GET /deals/{id}                        | Deal detail                                      | Includes a summarized activities/contacts/files block, not full child collections                              |
| PATCH /deals/{id}                      | Partial field update                             | Stage changes are rejected here — must use the dedicated endpoint below                                        |
| POST /deals/{id}/stage-transition      | Move a deal to a new stage                       | Runs Automation Studio validation rules; may return 409 pending-approval                                       |
| GET/POST /accounts, /contacts          | Standard CRUD                                    | Same pagination/filter conventions as Deals                                                                    |
| GET/POST /leads                        | Standard CRUD                                    | —                                                                                                              |
| POST /leads/{id}/convert               | Convert a lead                                   | Atomically creates/matches Account, Contact, and Deal in one transaction                                       |
| POST /activities                       | Log an activity                                  | Used both by manual entry and by auto-capture integrations                                                     |
| GET /ai-suggestions?status=pending     | AI queue                                         | Scoped to the requesting user by default; managers can query by team                                           |
| POST /ai-suggestions/{id}/respond      | Accept/edit/reject a suggestion                  | Body: { action, edited_payload? }; always writes an audit entry                                                |
| GET /deals/{id}/closing-brief          | Retrieve the deal's synthesized closing guidance | Returns a cached DealClosingBrief if fresh; otherwise triggers generation and returns 202 with a job reference |
| POST /deals/{id}/closing-brief/refresh | Force regeneration                               | Used when new conversation data has landed since the last cached brief                                         |

### Example — deal closing brief

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>GET /api/v1/crm/deals/9f1c.../closing-brief</p>
<p>--- 200 OK ---</p>
<p>{</p>
<p>"deal_id": "9f1c...",</p>
<p>"closing_readiness_score": 72,</p>
<p>"objection_ledger": [</p>
<p>{ "objection": "pricing_vs_incumbent", "mentions": 3,</p>
<p>"status": "unresolved" },</p>
<p>{ "objection": "eu_data_residency", "mentions": 1,</p>
<p>"status": "unresolved" }</p>
<p>],</p>
<p>"recommended_next_action": {</p>
<p>"action": "Send ROI comparison and proactively answer the",</p>
<p>"confidence": 0.87,</p>
<p>"evidence_refs": ["meeting:7ac9...#00:18:40", "meeting:4b1e...#00:31:05"]</p>
<p>},</p>
<p>"similar_deals_ref": ["deal:fc-media-q1", "deal:al-arabia-q4"],</p>
<p>"generated_at": "2026-07-13T09:50:00Z"</p>
<p>}</p>
<p>// Every field here is generated by querying the AI Meeting Agent</p>
<p>// and Sales Enablement APIs at brief-generation time — nothing</p>
<p>// is duplicated into CRM's own storage ahead of time.</p></td>
</tr>
</tbody>
</table>

### Example — stage transition request/response

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>POST /api/v1/crm/deals/9f1c.../stage-transition</p>
<p>Idempotency-Key: 3b2a-...</p>
<p>{</p>
<p>"to_stage": "negotiation",</p>
<p>"reason_code": "pricing_agreed",</p>
<p>"evidence_ref": "meeting:7ac9..."</p>
<p>}</p>
<p>--- 200 OK ---</p>
<p>{</p>
<p>"deal_id": "9f1c...",</p>
<p>"from_stage": "proposal",</p>
<p>"to_stage": "negotiation",</p>
<p>"status": "applied",</p>
<p>"stage_history_id": "aa41..."</p>
<p>}</p>
<p>--- 409 Conflict (validation not met) ---</p>
<p>{</p>
<p>"error": {</p>
<p>"code": "stage_transition_blocked",</p>
<p>"message": "Missing required evidence: linked pricing document",</p>
<p>"details": { "rule_id": "proposal_to_negotiation_v1" }</p>
<p>}</p>
<p>}</p></td>
</tr>
</tbody>
</table>

## 3.4 Integration Bus Event Catalog

Every event carries a common envelope: { event_id, schema_version, tenant_id, occurred_at, payload }. CRM both publishes and subscribes to the bus — it never calls another module's API directly.

***Events CRM publishes***

| **Event**              | **Payload Summary**                                    | **Typical Consumers**                                                     |
|------------------------|--------------------------------------------------------|---------------------------------------------------------------------------|
| crm.deal.created       | deal_id, account_id, owner_id, amount                  | Revenue Intelligence, Automation Studio                                   |
| crm.deal.stage_changed | deal_id, from_stage, to_stage, changed_by, reason_code | Revenue Intelligence, Sales Enablement (coaching triggers)                |
| crm.deal.closed_won    | deal_id, account_id, amount, close_date                | Customer Success (onboarding playbook), Finance (Phase 2 invoice trigger) |
| crm.deal.closed_lost   | deal_id, reason                                        | Revenue Intelligence (loss pattern analysis)                              |
| crm.contact.updated    | contact_id, changed_fields                             | Lead Gen Directory (dedupe/enrich), Customer Success                      |

***Events CRM subscribes to***

| **Event**                              | **Published By**          | **CRM Reaction**                                                                      |
|----------------------------------------|---------------------------|---------------------------------------------------------------------------------------|
| leadgen.lead.created                   | Lead Generation Directory | Creates a Lead record and routes it to the owner's inbox per SLA rules                |
| meetingagent.meeting.summarized        | AI Meeting Agent          | Creates an Activity and one or more AISuggestion records with source_evidence_ref set |
| meetingagent.commitment.captured       | AI Meeting Agent          | Creates or updates a mutual-action-plan item on the linked Deal                       |
| customersuccess.account.health_changed | Customer Success module   | Updates the cached Account.health_score and surfaces renewal risk on Deal Detail      |
| automation.workflow.triggered          | Automation Studio         | Executes the configured action against the specified CRM record                       |

### Example — event payload

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>{</p>
<p>"event_id": "evt_8a21...",</p>
<p>"event_type": "meetingagent.meeting.summarized",</p>
<p>"schema_version": 1,</p>
<p>"tenant_id": "tn_442...",</p>
<p>"occurred_at": "2026-07-13T09:41:00Z",</p>
<p>"payload": {</p>
<p>"meeting_id": "mtg_119...",</p>
<p>"deal_id": "deal_9f1c...",</p>
<p>"proposed_updates": [</p>
<p>{ "field": "expected_close_date", "value": "2027-03-14",</p>
<p>"confidence": 0.92, "evidence_timestamp": "00:14:22" }</p>
<p>],</p>
<p>"action_items": [ { "text": "Send legal redline", "owner": "rep" } ]</p>
<p>}</p>
<p>}</p></td>
</tr>
</tbody>
</table>

# 4. Sprint-Ready User Stories & Acceptance Criteria

A representative starting set — enough to seed the first sprints and to serve as the template pattern for writing the remaining backlog. “MVP” stories are needed for Phase 1 launch; “Fast-follow” stories can ship shortly after.

## 4.1 Home / Sales Workspace

**US-CRM-001** — **MVP**

As a rep, I want to see what changed since my last login, so that I can start my day knowing what needs attention without manually checking every record.

**Acceptance Criteria:**

- Given I log in after any absence, when Home loads, then I see a digest of new replies, stage changes, new risk flags, and summarized meetings, each linking to its record.

- Given no changes occurred since my last login, when Home loads, then the digest shows an explicit empty state rather than an empty box.

- Given a digest item is older than the configurable window (default 30 days), when Home loads, then it is excluded.

**US-CRM-002** — **MVP**

As a rep, I want to accept, edit, or reject each AI suggestion individually, so that I stay in control of what gets written to my records.

**Acceptance Criteria:**

- Given a pending suggestion, when I click Accept, then the change applies and an audit entry records source, confidence score, and my user ID as approver.

- Given a pending suggestion, when I click Edit, then I can modify the value before applying; the audit log stores both the original AI value and my edited value.

- Given a pending suggestion, when I click Reject, then no change applies and it is excluded from future time-saved calculations.

- Given a suggestion's confidence is below the tenant's configured threshold (default 60%), when generated, then it is visually flagged as low-confidence.

**US-CRM-003** — **MVP**

As a rep, I want to see how much time automation saved me this week, so that I have a visible, personal reason to trust and keep using the platform.

**Acceptance Criteria:**

- Given at least one suggestion was accepted this week, when I view Home, then the panel shows a cumulative estimate using a per-action-type time value.

- Given zero suggestions were accepted this week, when I view Home, then the panel shows an explicit zero state with a call to action, not a hidden panel.

**US-CRM-004** — **Fast-follow**

As a manager, I want to see pipeline risk, activity quality, forecast drift, and coaching queue at a glance, so that I know where to intervene without opening five separate reports.

**Acceptance Criteria:**

- Given I hold the Manager role, when I view Home, then the Team Pulse panel renders.

- Given I hold only the Employee role, when I view Home, then the panel is not rendered server-side (not merely hidden client-side).

## 4.2 Deals List / Pipeline

**US-CRM-005** — **MVP**

As a rep, I want to filter and view my pipeline as a Kanban board, so that I can quickly see where every deal stands.

**Acceptance Criteria:**

- Given I set filters (stage, owner, amount, aging, health score, competitor, next action), when I navigate away and return within the session, then my filters persist.

- Given a deal card, when rendered, then it shows company name, amount, a color-coded health-score badge, a next-action snippet, and owner avatar.

- Given more than 4 deals in a stage column, when rendered, then the first 4 show and a “+N more” control loads additional cards on demand.

**US-CRM-006** — **MVP**

As a rep, I want the system to require the evidence a stage transition needs, so that pipeline data stays trustworthy for forecasting.

**Acceptance Criteria:**

- Given a tenant-configured validation rule for a stage transition, when I attempt a move without satisfying it, then the move is blocked with a message naming the specific missing requirement.

- Given a transition that requires manager approval, when I move the deal, then it enters a pending-approval state and is excluded from the new stage's forecast count until approved.

- Given any completed stage move, when it applies, then a DealStageHistory record captures from_stage, to_stage, changed_by (or automation rule ID), reason_code, and timestamp.

**US-CRM-007** — **MVP**

As a rep, I want to preview a deal without leaving the pipeline board, so that I can triage quickly across many deals.

**Acceptance Criteria:**

- Given I click a deal card, when the preview drawer opens, then it shows last touch, next step, AI risk signal, linked contacts, files, and tags without a page navigation.

- Given the drawer is open, when I click outside it or press Escape, then it closes and focus returns to the previously selected card.

**US-CRM-008** — **Fast-follow**

As a rep, I want to bulk-reassign or bulk-tag deals, so that I don't have to update records one at a time after a territory change.

**Acceptance Criteria:**

- Given I multi-select deal cards, when I choose Reassign, then all selected deals update owner_id in one transaction, each generating its own audit entry rather than one unlogged bulk write.

## 4.3 Deal Detail

**US-CRM-009** — **MVP**

As a rep, I want one page showing everything relevant to a deal, so that I don't have to piece it together across tabs or tools.

**Acceptance Criteria:**

- Given a deal with linked activities, meetings, contacts, and files, when Deal Detail opens, then the sticky header, stage bar, summary, activities, communication intelligence, financials, linked records, AI guidance, and collaboration feed all render without a separate page load.

- Given the AI Meeting Agent has processed a linked call, when I view Communication Intelligence, then I see objections, unanswered questions, and stakeholder mentions, each linking back to the source transcript moment.

**US-CRM-010** — **MVP**

As a rep, I want AI-suggested field updates from a meeting to show their confidence and source, so that I can trust or verify them before they change my deal record.

**Acceptance Criteria:**

- Given the Meeting Agent proposes a close-date change, when it appears on Deal Detail, then it shows as a pending suggestion (never already-applied), with a link to the specific transcript moment used as evidence.

- Given a suggestion's confidence is below threshold, when displayed, then it routes to a review queue rather than being visually presented as ready-to-accept.

**US-CRM-011** — **Fast-follow**

As a rep, I want to share a mutual action plan with the buyer, so that both sides can track commitments without a separate email thread.

**Acceptance Criteria:**

- Given I generate a mutual action plan, when I share it, then the buyer receives a link to a limited external view showing only shared plan items — no internal financials or notes.

- Given the buyer marks their own item complete, when I view Deal Detail, then the plan reflects it in near-real-time and logs it as a buyer-side activity.

## 4.4 Leads (in CRM Context)

**US-CRM-012** — **MVP**

As a rep, I want to qualify a lead with the fewest fields that actually predict conversion, so that I'm not filling out a form with no clear payoff.

**Acceptance Criteria:**

- Given the tenant's historical win data has identified the correlating fields (configurable, default 5), when I open a new lead's qualification form, then only those fields are required and all others are optional and collapsed by default.

**US-CRM-013** — **MVP**

As a rep, I want converting a lead to map every relevant field into the new Account, Contact, and Deal, so that I don't have to re-enter information I already captured.

**Acceptance Criteria:**

- Given a qualified lead, when I click Convert, then an Account, Contact, and Deal are created (or matched to existing records) in one transaction, and the Lead is marked converted with a link to the resulting Deal.

- Given the lead's email matches an existing Contact, when I convert, then I am prompted to merge rather than silently creating a duplicate.

## 4.5 Accounts & Contacts

**US-CRM-014** — **MVP**

As a rep, I want a single Account view showing pipeline, contacts, support health, and renewal risk, so that I have full context before any customer conversation.

**Acceptance Criteria:**

- Given an Account with open deals and a Customer Success health score, when I open Account 360, then both render on the same page, with the health score read live from the Customer Success module rather than a stale cached copy.

**US-CRM-015** — **Fast-follow**

As a rep, I want to link one contact to multiple accounts, so that I can correctly represent advisors, investors, or group decision-makers.

**Acceptance Criteria:**

- Given a contact linked to two or more accounts, when I view any linked Account's Contacts page, then that contact shows a visual indicator of their other account associations.

## 4.6 Activities

**US-CRM-016** — **MVP**

As a rep, I want emails and meetings to log themselves against the right deal automatically, so that I never have to manually log routine activity.

**Acceptance Criteria:**

- Given an email is sent to or received from a contact linked to an open deal, when the email-listener integration processes it, then an Activity is created with source auto-captured-email, linked to that deal, with no manual entry.

- Given an auto-captured activity could belong to two open deals for the same contact, when this ambiguity exists, then it is queued for one-click confirmation rather than guessed silently.

## 4.7 Deal Closing Guidance (new)

This is the CRM-side home for Sales Enablement, distinct from the team-wide Conversation Intelligence Dashboard specified in the AI Meeting Agent document. That dashboard answers “who needs coaching.” This page answers “how do I close this specific deal,” by synthesizing every call, email, and conversation tied to it.

**US-CRM-017** — **MVP**

As a rep, I want one page that synthesizes every call, email, and meeting tied to a deal into a single closing-focused view, so that I don't have to mentally reconstruct the deal's history before deciding what to do next.

**Acceptance Criteria:**

- Given a deal with multiple linked meetings and activities, when I open its Closing Guidance page, then the Conversation History Digest shows every meeting/email chronologically with a one-line synthesized takeaway per entry, not a raw list requiring me to open each one.

- Given the underlying conversation data has not changed since the last time the brief was generated, when I reopen the page, then the cached DealClosingBrief is served immediately rather than regenerated on every view.

**US-CRM-018** — **MVP**

As a rep, I want every objection raised across every call for this deal consolidated into one ledger, with mention count and resolution status, so that I know exactly which concerns are still unaddressed instead of half-remembering them from separate calls.

**Acceptance Criteria:**

- Given the same objection is raised in more than one call, when it appears in the Objection & Risk Ledger, then it shows as a single entry with a mention count and first/last-raised dates, not as duplicate rows.

- Given an objection has been directly addressed in a later call or email, when the ledger is generated, then its status updates to resolved, with a link to the moment it was addressed.

**US-CRM-019** — **MVP**

As a rep, I want a single recommended next action synthesized from this deal's full history and from similar deals that closed, so that I get one clear next step instead of a list I have to prioritize myself.

**Acceptance Criteria:**

- Given open objections and a deal stage, when the recommended next action is generated, then it names the specific unresolved objection(s) it addresses and links to the exact evidence (transcript moments) that justify it, with a confidence score — the same accept/edit/reject pattern as every other AI suggestion on the platform, not an auto-sent action.

**US-CRM-020** — **Fast-follow**

As a rep, I want to see similar historically won deals and what worked, matched by industry, size, and objection pattern, so that I can borrow a proven playbook instead of improvising.

**Acceptance Criteria:**

- Given Closed-Won deals with overlapping objections and comparable firmographics, when matched, then each is shown with a short note on what specifically resolved the shared objection, sourced from the Sales Enablement win/loss library.

**US-CRM-021** — **MVP**

As a manager, I want the closing readiness score to be explainable, not a bare number, so that I can coach a rep on the specific thing dragging a deal down rather than guessing.

**Acceptance Criteria:**

- Given a deal's closing readiness score, when displayed, then it is shown alongside the specific factors driving it (unresolved objections, sentiment trend, stakeholder engagement gaps), not as an unexplained single number.

# 5. UI Wireframes — Key Pages

Low-fidelity structural wireframes for the three highest-priority CRM pages, showing zone hierarchy and content structure rather than final visual design. Dashed borders mark conditional or lower-priority zones; solid borders mark MVP-critical zones.

## 5.1 Home / Sales Workspace

*[Wireframe image — see the original DOCX/PDF for the visual; not included in this text version]*

*Left column: What Changed digest, My Priorities, AI Queue (all MVP). Right column: Time Saved (MVP) and Team Pulse (fast-follow, manager-only).*

## 5.2 Deals List / Pipeline

*[Wireframe image — see the original DOCX/PDF for the visual; not included in this text version]*

*Sticky filter bar, multi-stage Kanban board, and the deal-preview drawer shown as an overlay on card click.*

## 5.3 Deal Detail

*[Wireframe image — see the original DOCX/PDF for the visual; not included in this text version]*

*Sticky header and stage progress bar, two-column body: main execution blocks on the left, AI guidance / linked records / mutual action plan / collaboration on the right.*

## 5.4 Deal Closing Guidance (new)

*[Wireframe image — see the original DOCX/PDF for the visual; not included in this text version]*

*An explainable closing readiness score, the conversation digest and objection ledger synthesized across every call for this deal, and the recommended next action, similar won deals, and content recommendations on the right.*

# 6. Resolving the Flagged Dependency: Deal Closing Guidance Data Access

Section 4.7/5.4 was flagged as depending on data access that hadn't been confirmed. Rather than leave that as an open question for whoever picks up the build, here is what's actually missing, and the recommended fix.

## 6.1 What's Actually Missing

- **The raw data is reachable, but not efficiently.** The AI Meeting Agent's Meeting entity already has a deal_id field, and its GET /meetings endpoint already supports filtering by deal (Section 3.2 of that document). So the objection and summary data does exist and is queryable today — but only one meeting at a time. Assembling a deduplicated objection ledger for a deal with, say, six calls would mean calling GET /meetings?deal_id=X to list them, then GET /meetings/{id} six separate times, then merging and deduplicating objections in CRM's own code. That N+1 pattern gets slower as a deal accumulates history, which is exactly when the brief matters most.

- **The similar-won-deals lookup doesn't exist anywhere yet.** No endpoint in any module currently answers “find Closed-Won deals with a similar objection pattern.” The Meeting Agent's win/loss call library is searchable, but pattern-matching across many deals by objection similarity is a different kind of query — and it's exactly the job the Unified Revenue Intelligence layer (Blueprint Section 9) already exists to do at portfolio scale. That layer hasn't yet been given its own full engineering specification in this series, which is why this gap surfaced here first.

## 6.2 Recommended Solution

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Two aggregated endpoints, each owned by the module that already owns the data — not a bespoke integration built just for this page</strong></p>
<p><em>1) The AI Meeting Agent adds GET /deals/{deal_id}/conversation-summary, returning the deduplicated objection ledger and conversation digest for every meeting linked to that deal in one call. This is a natural extension of a module that already summarizes its own meetings — it is aggregating its own data, not CRM reaching into it. 2) The Unified Revenue Intelligence layer adds GET /deals/{deal_id}/similar-won-deals, returning Closed-Won deals matched by industry, size, and objection overlap — the same kind of cross-deal pattern analysis its Anomaly Investigation Workspace already does at portfolio scale, just scoped to one deal on request. CRM's DealClosingBrief generator then calls exactly these two endpoints plus its own Deal/Activity data: three calls total, not N+2.</em></p></td>
</tr>
</tbody>
</table>

This keeps the same rule this whole series has followed: aggregation logic lives with the module that owns the underlying data, and no module builds a second copy of another module's analysis to save itself an API call.

## 6.3 Steps to Follow

- 1\. Add the conversation-summary endpoint to the AI Meeting Agent's own specification (its Section 3.2) before building the DealClosingBrief generator here — this is a prerequisite, not parallel work that can happen at the same time.

- 2\. When the Unified Revenue Intelligence layer receives its own full engineering specification (it currently exists only at the strategic-summary level in the Comprehensive Blueprint), include the similar-won-deals endpoint in its initial scope rather than letting it be treated as a CRM-specific feature.

- 3\. If Deal Closing Guidance needs to ship before Revenue Intelligence has its own specification, have the similar-won-deals section return an empty state rather than building a one-off version inside CRM that would later need to be torn out and replaced.

- 4\. No Integration Bus event is needed for either lookup — both are synchronous, read-only calls made at brief-generation time, not something CRM subscribes to. Section 3.4's event catalog does not need an entry for this.

# 7. What Comes Next

This document unblocks engineering and design for the CRM Engine specifically. To fully de-risk the build:

- Repeat this same treatment (schema, API/event contracts, stories, wireframes) for Lead Generation, AI Meeting Agent, and Customer Success — the other Phase 1/1.5 modules.

- Resolve the cross-module decisions flagged in Section 1 (ML model choice, transcription/enrichment/telephony vendors, visual design system) since they affect every module, not just CRM.

- Track the two endpoint additions in Section 6 to closure explicitly in sprint planning — they are dependencies of Deal Closing Guidance, not optional enhancements to it.

- Confirm the MVP-vs-fast-follow split above with engineering leads before sprint planning, since story point estimates may shift the line.
