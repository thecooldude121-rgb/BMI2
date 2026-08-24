-- ============================================================================
-- 000_baseline_schema.sql — the authoritative starting point for this database.
--
-- WHY THIS FILE EXISTS
-- Until now the DDL for the live bmi_crm database existed in NO repository.
-- Schema changes lived in three unsynchronised places:
--   1. Backend/src/config/migrate.ts  — the documented `npm run db:migrate`
--      path, which described a DIFFERENT database (an `accounts` table instead
--      of `companies`, UUID ids instead of D001/CT001, first_name/last_name
--      instead of name). Running it produced a schema the application could not
--      use. It has been removed; see the note in its place.
--   2. Backend/migrations/*.sql      — numbered files executed by nothing.
--   3. runMigrations() in index.ts   — inline SQL run on every server boot.
-- A fresh clone could not boot: it died on `relation "lead_views" does not
-- exist`, because the table is only created by a file nothing ran.
--
-- This file is a pg_dump --schema-only of the real database, so a clone can
-- reproduce the actual schema. Numbered migrations from 011 onward apply on top
-- of it, in order, tracked in the schema_migrations ledger (see 011).
--
-- Migrations 001-010 are already folded into this baseline. They are kept in
-- this directory for history only and must NOT be re-applied.
--
-- Generated: 2026-08-25 from the live database.
-- Regenerate with:
--   pg_dump -h localhost -U venkatraj -d bmi_crm --schema-only \
--     --no-owner --no-privileges | grep -v '^\\'
--
-- The grep matters: pg_dump 16 emits `\restrict` / `\unrestrict` psql
-- meta-commands, which are not valid SQL over a driver connection and make the
-- whole file fail with `syntax error at or near "\"`.
--
-- This file is exempt from the runner's checksum lock, because it is a snapshot
-- of current state rather than a step in a sequence — regenerating it is
-- expected. Every OTHER migration is locked once applied.
-- ============================================================================

--
-- PostgreSQL database dump
--

-- (psql meta-command removed: not valid SQL over a driver connection)

-- Dumped from database version 16.14 (Homebrew)
-- Dumped by pg_dump version 16.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id character varying(10) DEFAULT "substring"(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 9) NOT NULL,
    subject character varying(200) NOT NULL,
    type character varying(20),
    direction character varying(10),
    status character varying(15),
    priority character varying(10),
    description text,
    outcome text,
    duration integer,
    scheduled_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_by character varying(100),
    assigned_to character varying(100),
    lead_id integer,
    deal_id character varying(10),
    contact_id character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id uuid NOT NULL,
    CONSTRAINT activities_direction_check CHECK (((direction)::text = ANY ((ARRAY['inbound'::character varying, 'outbound'::character varying])::text[]))),
    CONSTRAINT activities_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT activities_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'no_show'::character varying, 'rescheduled'::character varying])::text[]))),
    CONSTRAINT activities_type_check CHECK (((type)::text = ANY ((ARRAY['call'::character varying, 'email'::character varying, 'meeting'::character varying, 'task'::character varying, 'note'::character varying, 'sms'::character varying, 'whatsapp'::character varying, 'linkedin'::character varying, 'demo'::character varying, 'proposal'::character varying, 'document'::character varying, 'visit'::character varying])::text[])))
);


--
-- Name: approval_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_processes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    module character varying(50) NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    approval_process_id uuid,
    record_id character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    requested_by character varying(10),
    current_step integer DEFAULT 1,
    status character varying(20) DEFAULT 'pending'::character varying,
    comments text,
    created_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone,
    CONSTRAINT approval_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'recalled'::character varying])::text[])))
);


--
-- Name: approval_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    approval_process_id uuid NOT NULL,
    step_number integer NOT NULL,
    approver_type character varying(30),
    approver_id character varying(100),
    approval_type character varying(20) DEFAULT 'unanimous'::character varying,
    CONSTRAINT approval_steps_approval_type_check CHECK (((approval_type)::text = ANY ((ARRAY['unanimous'::character varying, 'any'::character varying])::text[]))),
    CONSTRAINT approval_steps_approver_type_check CHECK (((approver_type)::text = ANY ((ARRAY['user'::character varying, 'role'::character varying, 'manager'::character varying])::text[])))
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module character varying(50) NOT NULL,
    record_id character varying(100) NOT NULL,
    action character varying(20) NOT NULL,
    changed_by character varying(100),
    changes jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT audit_log_action_check CHECK (((action)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'view'::character varying, 'export'::character varying, 'import'::character varying, 'login'::character varying, 'logout'::character varying])::text[])))
);


--
-- Name: blueprint_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blueprint_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blueprint_id uuid NOT NULL,
    stage_name character varying(100) NOT NULL,
    "position" integer NOT NULL,
    required_fields jsonb DEFAULT '[]'::jsonb,
    checklist jsonb DEFAULT '[]'::jsonb,
    allowed_roles jsonb DEFAULT '[]'::jsonb,
    sla_hours integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: blueprint_transitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blueprint_transitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blueprint_id uuid NOT NULL,
    from_stage_id uuid,
    to_stage_id uuid NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb,
    required_fields jsonb DEFAULT '[]'::jsonb,
    actions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: blueprints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blueprints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    pipeline_id uuid,
    is_active boolean DEFAULT true,
    created_by character varying(10),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    domain character varying(100),
    industry character varying(50),
    size character varying(20),
    revenue bigint,
    website character varying(200),
    phone character varying(20),
    description text,
    street character varying(150),
    city character varying(50),
    state character varying(50),
    country character varying(50),
    zip_code character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id uuid NOT NULL,
    CONSTRAINT companies_size_check CHECK (((size)::text = ANY ((ARRAY['1-10'::character varying, '11-50'::character varying, '51-200'::character varying, '201-500'::character varying, '501-1000'::character varying, '1000+'::character varying, 'unknown'::character varying])::text[])))
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id character varying(10) NOT NULL,
    company_id character varying(10),
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    mobile character varying(20),
    "position" character varying(100),
    department character varying(100),
    linkedin_url character varying(200),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id uuid NOT NULL
);


--
-- Name: custom_field_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_field_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    label character varying(150) NOT NULL,
    field_type character varying(30) NOT NULL,
    options jsonb DEFAULT '[]'::jsonb,
    formula text,
    is_required boolean DEFAULT false,
    is_unique boolean DEFAULT false,
    is_active boolean DEFAULT true,
    "position" integer DEFAULT 0,
    section character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT custom_field_definitions_field_type_check CHECK (((field_type)::text = ANY ((ARRAY['text'::character varying, 'number'::character varying, 'date'::character varying, 'datetime'::character varying, 'boolean'::character varying, 'picklist'::character varying, 'multi_select'::character varying, 'lookup'::character varying, 'formula'::character varying, 'url'::character varying, 'email'::character varying, 'phone'::character varying, 'currency'::character varying, 'textarea'::character varying])::text[])))
);


--
-- Name: custom_field_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_field_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    field_id uuid NOT NULL,
    module character varying(50) NOT NULL,
    record_id character varying(100) NOT NULL,
    value_text text,
    value_number numeric,
    value_date date,
    value_boolean boolean,
    value_json jsonb,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id character varying(10) NOT NULL,
    name character varying(150) NOT NULL,
    title character varying(150),
    lead_id integer,
    value numeric(12,2) NOT NULL,
    stage character varying(20),
    probability integer,
    expected_close_date date,
    assigned_to character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    description text,
    next_step text,
    notes text,
    company_name character varying(200),
    contact_name character varying(200),
    contact_email character varying(200),
    contact_title character varying(100),
    source character varying(100),
    priority character varying(20) DEFAULT 'Medium'::character varying,
    tags text[],
    product character varying(100),
    contract_term character varying(50),
    payment_terms character varying(50),
    updated_at timestamp without time zone DEFAULT now(),
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    base_amount_usd numeric(12,2) DEFAULT 0 NOT NULL,
    pipeline_id character varying(50) DEFAULT 'new-business'::character varying NOT NULL,
    pipeline_name character varying(100) DEFAULT 'New Business'::character varying NOT NULL,
    deal_type character varying(30) DEFAULT 'new-business'::character varying NOT NULL,
    stakeholders jsonb DEFAULT '[]'::jsonb NOT NULL,
    close_date_is_past boolean DEFAULT false NOT NULL,
    close_date_override_reason character varying(500),
    competitors jsonb DEFAULT '[]'::jsonb NOT NULL,
    forecast_category character varying(20),
    attachment_metadata jsonb DEFAULT '[]'::jsonb,
    win_prob_ai integer DEFAULT 0,
    win_prob_override_reason text,
    next_step_due_date date,
    next_step_owner text,
    next_step_status text DEFAULT 'pending'::text,
    is_test boolean DEFAULT false NOT NULL,
    sales_drive_folder text,
    agreement_url text,
    account_module_setup text,
    client_discovers text,
    discovery_date date,
    platform_fee numeric(15,2),
    custom_fee numeric(15,2),
    license_fee numeric(15,2),
    onboarding_fee numeric(15,2),
    white_labelling_fee numeric(15,2),
    exchange_rate numeric(15,6) DEFAULT 1,
    nr_margin numeric(15,2),
    start_date date,
    contract_end_date date,
    country text,
    account_industry text,
    tenant_id uuid NOT NULL,
    CONSTRAINT deals_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
    CONSTRAINT next_step_status_check CHECK ((next_step_status = ANY (ARRAY['pending'::text, 'done'::text, 'overdue'::text])))
);


--
-- Name: COLUMN deals.next_step; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.next_step IS 'Free-text description of the next action';


--
-- Name: COLUMN deals.next_step_due_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.next_step_due_date IS 'Date by which the next step must be completed';


--
-- Name: COLUMN deals.next_step_owner; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.next_step_owner IS 'Person responsible for executing the next step';


--
-- Name: COLUMN deals.next_step_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.next_step_status IS 'Completion state: pending | done | overdue';


--
-- Name: COLUMN deals.is_test; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.is_test IS 'True for dev/test records excluded from production views. Pass include_test=true to the API to see them.';


--
-- Name: COLUMN deals.sales_drive_folder; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.sales_drive_folder IS 'URL to the shared sales drive folder for this deal';


--
-- Name: COLUMN deals.agreement_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.agreement_url IS 'URL to the agreement / contract document';


--
-- Name: COLUMN deals.account_module_setup; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.account_module_setup IS 'URL to the account and module setup guide';


--
-- Name: COLUMN deals.client_discovers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.client_discovers IS 'URL to the client discovery or RFP document';


--
-- Name: COLUMN deals.discovery_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deals.discovery_date IS 'Date the opportunity was first identified / entered the pipeline';


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(300) NOT NULL,
    file_url character varying(500),
    file_size bigint,
    file_type character varying(50),
    module character varying(50),
    record_id character varying(100),
    version integer DEFAULT 1,
    tags jsonb DEFAULT '[]'::jsonb,
    uploaded_by character varying(10),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    subject character varying(500) NOT NULL,
    body text NOT NULL,
    category character varying(50),
    module character varying(50),
    is_active boolean DEFAULT true,
    created_by character varying(10),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    role character varying(20),
    department character varying(50),
    hire_date date,
    status character varying(10),
    salary numeric(10,2),
    password_hash character varying(255),
    avatar character varying(300),
    quota numeric(14,2) DEFAULT 0,
    territory_id character varying(20),
    manager_id character varying(10),
    CONSTRAINT employees_role_check CHECK (((role)::text = ANY ((ARRAY['Admin'::character varying, 'Manager'::character varying, 'Sales'::character varying, 'HR'::character varying])::text[]))),
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: forecast_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(10) NOT NULL,
    period character varying(20) NOT NULL,
    pipeline_id uuid,
    committed numeric(14,2) DEFAULT 0,
    best_case numeric(14,2) DEFAULT 0,
    pipeline_value numeric(14,2) DEFAULT 0,
    closed numeric(14,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: forecast_quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(10) NOT NULL,
    period character varying(20) NOT NULL,
    quota numeric(14,2) DEFAULT 0 NOT NULL,
    pipeline_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: forecast_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    period_label character varying(20) NOT NULL,
    snapshot_date date DEFAULT CURRENT_DATE NOT NULL,
    rep_name character varying(255) NOT NULL,
    pipeline numeric(15,2) DEFAULT 0 NOT NULL,
    best_case numeric(15,2) DEFAULT 0 NOT NULL,
    commit numeric(15,2) DEFAULT 0 NOT NULL,
    closed numeric(15,2) DEFAULT 0 NOT NULL,
    deal_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid NOT NULL
);


--
-- Name: TABLE forecast_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.forecast_snapshots IS 'Point-in-time per-rep forecast captures. Used for slippage tracking and commit accuracy.';


--
-- Name: gamification_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gamification_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(10) NOT NULL,
    badge_id uuid,
    earned_at timestamp without time zone DEFAULT now()
);


--
-- Name: gamification_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gamification_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50),
    points integer DEFAULT 0,
    criteria jsonb DEFAULT '{}'::jsonb
);


--
-- Name: gamification_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gamification_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(10) NOT NULL,
    points integer NOT NULL,
    reason character varying(200),
    module character varying(50),
    record_id character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    number character varying(50),
    order_id uuid,
    quote_id uuid,
    status character varying(30) DEFAULT 'Draft'::character varying,
    due_date date,
    total numeric(14,2) DEFAULT 0,
    paid_amount numeric(14,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: lead_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_calls (
    id bigint NOT NULL,
    lead_id integer NOT NULL,
    direction text DEFAULT 'outbound'::text NOT NULL,
    duration_seconds integer,
    outcome text,
    disposition text,
    notes text,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT ''::text NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT lead_calls_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text])))
);


--
-- Name: lead_calls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_calls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_calls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_calls_id_seq OWNED BY public.lead_calls.id;


--
-- Name: lead_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_emails (
    id bigint NOT NULL,
    lead_id integer NOT NULL,
    direction text DEFAULT 'outbound'::text NOT NULL,
    from_email text NOT NULL,
    to_emails text[] DEFAULT '{}'::text[] NOT NULL,
    cc_emails text[] DEFAULT '{}'::text[] NOT NULL,
    subject text NOT NULL,
    body_text text,
    body_html text,
    template_id text,
    sent_at timestamp with time zone,
    status text DEFAULT 'sent'::text NOT NULL,
    open_count integer DEFAULT 0 NOT NULL,
    click_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT ''::text NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT lead_emails_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text])))
);


--
-- Name: lead_emails_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_emails_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_emails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_emails_id_seq OWNED BY public.lead_emails.id;


--
-- Name: lead_meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_meetings (
    id bigint NOT NULL,
    lead_id integer NOT NULL,
    title text NOT NULL,
    description text,
    meeting_type text,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30 NOT NULL,
    location text,
    meeting_url text,
    attendees text[] DEFAULT '{}'::text[] NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    notes text,
    outcome text,
    next_steps text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT ''::text NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT lead_meetings_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text, 'rescheduled'::text])))
);


--
-- Name: lead_meetings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_meetings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_meetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_meetings_id_seq OWNED BY public.lead_meetings.id;


--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_notes (
    id bigint NOT NULL,
    lead_id integer NOT NULL,
    content text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT ''::text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    tenant_id uuid NOT NULL
);


--
-- Name: lead_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_notes_id_seq OWNED BY public.lead_notes.id;


--
-- Name: lead_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_tasks (
    id bigint NOT NULL,
    lead_id integer NOT NULL,
    title text NOT NULL,
    description text,
    task_type text,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    assigned_to text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT ''::text NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT lead_tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT lead_tasks_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'deferred'::text])))
);


--
-- Name: lead_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_tasks_id_seq OWNED BY public.lead_tasks.id;


--
-- Name: lead_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_by text,
    sort_order text DEFAULT 'desc'::text NOT NULL,
    columns text[] DEFAULT '{}'::text[] NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_by text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    view_order integer DEFAULT 0 NOT NULL,
    visibility character varying(20) DEFAULT 'private'::character varying NOT NULL,
    search_query text DEFAULT ''::text NOT NULL,
    view_mode character varying(10) DEFAULT 'list'::character varying NOT NULL,
    icon character varying(50) DEFAULT 'list'::character varying NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    company character varying(100),
    "position" character varying(100),
    industry character varying(50),
    stage character varying(20),
    status character varying(20),
    score integer,
    value numeric(12,2),
    probability integer,
    expected_close_date date,
    source character varying(50),
    assigned_to character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    last_contact date,
    notes text,
    tags text,
    tenant_id uuid NOT NULL,
    CONSTRAINT leads_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
    CONSTRAINT leads_score_check CHECK (((score >= 0) AND (score <= 100))),
    CONSTRAINT leads_stage_check CHECK (((stage)::text = ANY ((ARRAY['new'::character varying, 'contacted'::character varying, 'qualified'::character varying, 'proposal'::character varying, 'won'::character varying, 'lost'::character varying])::text[]))),
    CONSTRAINT leads_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'nurturing'::character varying])::text[])))
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: macros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.macros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_by character varying(10),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meetings (
    id character varying(10) NOT NULL,
    title character varying(200) NOT NULL,
    date timestamp without time zone NOT NULL,
    duration integer,
    attendees text,
    type character varying(20),
    related_to_type character varying(10),
    related_to_id character varying(20),
    summary text,
    action_items text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meetings_related_to_type_check CHECK (((related_to_type)::text = ANY ((ARRAY['lead'::character varying, 'deal'::character varying])::text[]))),
    CONSTRAINT meetings_type_check CHECK (((type)::text = ANY ((ARRAY['sales-call'::character varying, 'internal'::character varying, 'client-meeting'::character varying])::text[])))
);


--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipeline_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pipeline_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    probability integer,
    "position" integer NOT NULL,
    color character varying(20) DEFAULT '#3B82F6'::character varying,
    is_won boolean DEFAULT false,
    is_lost boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id uuid NOT NULL,
    CONSTRAINT pipeline_stages_probability_check CHECK (((probability >= 0) AND (probability <= 100)))
);


--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipelines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    tenant_id uuid NOT NULL
);


--
-- Name: price_book_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_book_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    price_book_id uuid NOT NULL,
    product_id uuid NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount numeric(5,2) DEFAULT 0
);


--
-- Name: price_books; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_books (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    currency character varying(3) DEFAULT 'USD'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50),
    description text,
    category character varying(100),
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    tax_rate numeric(5,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    stock integer DEFAULT 0,
    reorder_level integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rep_name character varying(255) NOT NULL,
    period_label character varying(20) NOT NULL,
    quota_amount numeric(15,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid NOT NULL
);


--
-- Name: TABLE quotas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.quotas IS 'Per-rep per-quarter sales quota targets.';


--
-- Name: quote_line_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_line_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_id uuid NOT NULL,
    product_id uuid,
    name character varying(200) NOT NULL,
    description text,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount numeric(5,2) DEFAULT 0,
    tax_rate numeric(5,2) DEFAULT 0,
    total numeric(14,2) NOT NULL,
    "position" integer DEFAULT 0
);


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    number character varying(50),
    subject character varying(200) NOT NULL,
    deal_id character varying(10),
    contact_id character varying(10),
    company_id character varying(10),
    status character varying(30) DEFAULT 'Draft'::character varying,
    valid_until date,
    currency character varying(3) DEFAULT 'USD'::character varying,
    subtotal numeric(14,2) DEFAULT 0,
    discount_amount numeric(14,2) DEFAULT 0,
    tax_amount numeric(14,2) DEFAULT 0,
    total numeric(14,2) DEFAULT 0,
    terms text,
    notes text,
    assigned_to character varying(100),
    created_by character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT quotes_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Sent'::character varying, 'Accepted'::character varying, 'Rejected'::character varying, 'Expired'::character varying])::text[])))
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: sales_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    number character varying(50),
    quote_id uuid,
    deal_id character varying(10),
    status character varying(30) DEFAULT 'Pending'::character varying,
    total numeric(14,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    record_id character varying(100),
    module character varying(50),
    assigned_to character varying(10),
    is_read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color text,
    description text,
    category text,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id character varying(10) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    type character varying(20),
    priority character varying(10),
    status character varying(15),
    assigned_to character varying(100),
    related_to_type character varying(10),
    related_to_id character varying(20),
    due_date date,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id uuid NOT NULL,
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]))),
    CONSTRAINT tasks_related_to_type_check CHECK (((related_to_type)::text = ANY ((ARRAY['lead'::character varying, 'deal'::character varying, 'employee'::character varying])::text[]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'completed'::character varying])::text[]))),
    CONSTRAINT tasks_type_check CHECK (((type)::text = ANY ((ARRAY['call'::character varying, 'email'::character varying, 'meeting'::character varying, 'follow-up'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: territories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.territories (
    id character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id character varying(20),
    manager_id character varying(10),
    rules jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) DEFAULT ''::character varying NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    role character varying(30) DEFAULT 'sales'::character varying NOT NULL,
    department character varying(50),
    avatar_url character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id uuid NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: web_form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.web_form_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid,
    data jsonb NOT NULL,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: web_forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.web_forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    module character varying(50) DEFAULT 'leads'::character varying,
    fields jsonb DEFAULT '[]'::jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    embed_code text,
    submissions integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by character varying(10),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: workflow_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_rule_id uuid NOT NULL,
    action_type character varying(50) NOT NULL,
    action_config jsonb DEFAULT '{}'::jsonb,
    "position" integer DEFAULT 0,
    delay_minutes integer DEFAULT 0,
    CONSTRAINT workflow_actions_action_type_check CHECK (((action_type)::text = ANY ((ARRAY['send_email'::character varying, 'create_task'::character varying, 'update_field'::character varying, 'webhook'::character varying, 'create_record'::character varying, 'send_notification'::character varying])::text[])))
);


--
-- Name: workflow_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_rule_id uuid,
    record_id character varying(100),
    module character varying(50),
    status character varying(20) DEFAULT 'success'::character varying,
    error_message text,
    executed_at timestamp without time zone DEFAULT now(),
    CONSTRAINT workflow_executions_status_check CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'skipped'::character varying])::text[])))
);


--
-- Name: workflow_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    trigger_type character varying(50) NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_by character varying(10),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT workflow_rules_trigger_type_check CHECK (((trigger_type)::text = ANY ((ARRAY['on_create'::character varying, 'on_update'::character varying, 'on_delete'::character varying, 'scheduled'::character varying, 'field_update'::character varying])::text[])))
);


--
-- Name: lead_calls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_calls ALTER COLUMN id SET DEFAULT nextval('public.lead_calls_id_seq'::regclass);


--
-- Name: lead_emails id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_emails ALTER COLUMN id SET DEFAULT nextval('public.lead_emails_id_seq'::regclass);


--
-- Name: lead_meetings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_meetings ALTER COLUMN id SET DEFAULT nextval('public.lead_meetings_id_seq'::regclass);


--
-- Name: lead_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes ALTER COLUMN id SET DEFAULT nextval('public.lead_notes_id_seq'::regclass);


--
-- Name: lead_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tasks ALTER COLUMN id SET DEFAULT nextval('public.lead_tasks_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: approval_processes approval_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_processes
    ADD CONSTRAINT approval_processes_pkey PRIMARY KEY (id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (id);


--
-- Name: approval_steps approval_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_steps
    ADD CONSTRAINT approval_steps_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: blueprint_stages blueprint_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprint_stages
    ADD CONSTRAINT blueprint_stages_pkey PRIMARY KEY (id);


--
-- Name: blueprint_transitions blueprint_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprint_transitions
    ADD CONSTRAINT blueprint_transitions_pkey PRIMARY KEY (id);


--
-- Name: blueprints blueprints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprints
    ADD CONSTRAINT blueprints_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_tenant_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_tenant_email_key UNIQUE (tenant_id, email);


--
-- Name: custom_field_definitions custom_field_definitions_module_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT custom_field_definitions_module_name_key UNIQUE (module, name);


--
-- Name: custom_field_definitions custom_field_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT custom_field_definitions_pkey PRIMARY KEY (id);


--
-- Name: custom_field_values custom_field_values_field_id_record_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_field_id_record_id_key UNIQUE (field_id, record_id);


--
-- Name: custom_field_values custom_field_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: forecast_entries forecast_entries_employee_id_period_pipeline_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_entries
    ADD CONSTRAINT forecast_entries_employee_id_period_pipeline_id_key UNIQUE (employee_id, period, pipeline_id);


--
-- Name: forecast_entries forecast_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_entries
    ADD CONSTRAINT forecast_entries_pkey PRIMARY KEY (id);


--
-- Name: forecast_quotas forecast_quotas_employee_id_period_pipeline_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_quotas
    ADD CONSTRAINT forecast_quotas_employee_id_period_pipeline_id_key UNIQUE (employee_id, period, pipeline_id);


--
-- Name: forecast_quotas forecast_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_quotas
    ADD CONSTRAINT forecast_quotas_pkey PRIMARY KEY (id);


--
-- Name: forecast_snapshots forecast_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_snapshots
    ADD CONSTRAINT forecast_snapshots_pkey PRIMARY KEY (id);


--
-- Name: forecast_snapshots forecast_snapshots_tenant_period_rep_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_snapshots
    ADD CONSTRAINT forecast_snapshots_tenant_period_rep_date_key UNIQUE (tenant_id, period_label, rep_name, snapshot_date);


--
-- Name: gamification_achievements gamification_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_achievements
    ADD CONSTRAINT gamification_achievements_pkey PRIMARY KEY (id);


--
-- Name: gamification_badges gamification_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_badges
    ADD CONSTRAINT gamification_badges_pkey PRIMARY KEY (id);


--
-- Name: gamification_points gamification_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_points
    ADD CONSTRAINT gamification_points_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_number_key UNIQUE (number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lead_calls lead_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_calls
    ADD CONSTRAINT lead_calls_pkey PRIMARY KEY (id);


--
-- Name: lead_emails lead_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_emails
    ADD CONSTRAINT lead_emails_pkey PRIMARY KEY (id);


--
-- Name: lead_meetings lead_meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_meetings
    ADD CONSTRAINT lead_meetings_pkey PRIMARY KEY (id);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: lead_tasks lead_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tasks
    ADD CONSTRAINT lead_tasks_pkey PRIMARY KEY (id);


--
-- Name: lead_views lead_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_views
    ADD CONSTRAINT lead_views_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: leads leads_tenant_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_tenant_email_key UNIQUE (tenant_id, email);


--
-- Name: macros macros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.macros
    ADD CONSTRAINT macros_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: price_book_items price_book_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_book_items
    ADD CONSTRAINT price_book_items_pkey PRIMARY KEY (id);


--
-- Name: price_book_items price_book_items_price_book_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_book_items
    ADD CONSTRAINT price_book_items_price_book_id_product_id_key UNIQUE (price_book_id, product_id);


--
-- Name: price_books price_books_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_books
    ADD CONSTRAINT price_books_pkey PRIMARY KEY (id);


--
-- Name: products products_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_code_key UNIQUE (code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_name_key UNIQUE (name);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quotas quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotas
    ADD CONSTRAINT quotas_pkey PRIMARY KEY (id);


--
-- Name: quotas quotas_tenant_rep_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotas
    ADD CONSTRAINT quotas_tenant_rep_period_key UNIQUE (tenant_id, rep_name, period_label);


--
-- Name: quote_line_items quote_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_line_items
    ADD CONSTRAINT quote_line_items_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_number_key UNIQUE (number);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales_orders sales_orders_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_number_key UNIQUE (number);


--
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- Name: signals signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_tenant_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_tenant_name_key UNIQUE (tenant_id, name);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: territories territories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.territories
    ADD CONSTRAINT territories_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: web_form_submissions web_form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_form_submissions
    ADD CONSTRAINT web_form_submissions_pkey PRIMARY KEY (id);


--
-- Name: web_forms web_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_forms
    ADD CONSTRAINT web_forms_pkey PRIMARY KEY (id);


--
-- Name: workflow_actions workflow_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_actions
    ADD CONSTRAINT workflow_actions_pkey PRIMARY KEY (id);


--
-- Name: workflow_executions workflow_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_pkey PRIMARY KEY (id);


--
-- Name: workflow_rules workflow_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_rules
    ADD CONSTRAINT workflow_rules_pkey PRIMARY KEY (id);


--
-- Name: idx_activities_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_tenant_id ON public.activities USING btree (tenant_id);


--
-- Name: idx_companies_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_tenant_id ON public.companies USING btree (tenant_id);


--
-- Name: idx_contacts_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_tenant_id ON public.contacts USING btree (tenant_id);


--
-- Name: idx_deals_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_tenant_id ON public.deals USING btree (tenant_id);


--
-- Name: idx_forecast_snapshots_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forecast_snapshots_tenant_id ON public.forecast_snapshots USING btree (tenant_id);


--
-- Name: idx_lead_calls_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_calls_lead_id ON public.lead_calls USING btree (lead_id);


--
-- Name: idx_lead_calls_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_calls_tenant_id ON public.lead_calls USING btree (tenant_id);


--
-- Name: idx_lead_emails_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_emails_lead_id ON public.lead_emails USING btree (lead_id);


--
-- Name: idx_lead_emails_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_emails_tenant_id ON public.lead_emails USING btree (tenant_id);


--
-- Name: idx_lead_meetings_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_meetings_lead_id ON public.lead_meetings USING btree (lead_id);


--
-- Name: idx_lead_meetings_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_meetings_tenant_id ON public.lead_meetings USING btree (tenant_id);


--
-- Name: idx_lead_notes_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes USING btree (lead_id);


--
-- Name: idx_lead_notes_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_notes_tenant_id ON public.lead_notes USING btree (tenant_id);


--
-- Name: idx_lead_tasks_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_tasks_lead_id ON public.lead_tasks USING btree (lead_id);


--
-- Name: idx_lead_tasks_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_tasks_tenant_id ON public.lead_tasks USING btree (tenant_id);


--
-- Name: idx_lead_views_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_views_tenant_id ON public.lead_views USING btree (tenant_id);


--
-- Name: idx_leads_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_tenant_id ON public.leads USING btree (tenant_id);


--
-- Name: idx_pipeline_stages_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipeline_stages_tenant_id ON public.pipeline_stages USING btree (tenant_id);


--
-- Name: idx_pipelines_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipelines_tenant_id ON public.pipelines USING btree (tenant_id);


--
-- Name: idx_quotas_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotas_tenant_id ON public.quotas USING btree (tenant_id);


--
-- Name: idx_tags_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_tenant_id ON public.tags USING btree (tenant_id);


--
-- Name: idx_tasks_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_tenant_id ON public.tasks USING btree (tenant_id);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: activities activities_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: activities activities_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: activities activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: activities activities_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: approval_requests approval_requests_approval_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_approval_process_id_fkey FOREIGN KEY (approval_process_id) REFERENCES public.approval_processes(id);


--
-- Name: approval_steps approval_steps_approval_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_steps
    ADD CONSTRAINT approval_steps_approval_process_id_fkey FOREIGN KEY (approval_process_id) REFERENCES public.approval_processes(id) ON DELETE CASCADE;


--
-- Name: blueprint_stages blueprint_stages_blueprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprint_stages
    ADD CONSTRAINT blueprint_stages_blueprint_id_fkey FOREIGN KEY (blueprint_id) REFERENCES public.blueprints(id) ON DELETE CASCADE;


--
-- Name: blueprint_transitions blueprint_transitions_blueprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprint_transitions
    ADD CONSTRAINT blueprint_transitions_blueprint_id_fkey FOREIGN KEY (blueprint_id) REFERENCES public.blueprints(id) ON DELETE CASCADE;


--
-- Name: blueprint_transitions blueprint_transitions_from_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprint_transitions
    ADD CONSTRAINT blueprint_transitions_from_stage_id_fkey FOREIGN KEY (from_stage_id) REFERENCES public.blueprint_stages(id);


--
-- Name: blueprint_transitions blueprint_transitions_to_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprint_transitions
    ADD CONSTRAINT blueprint_transitions_to_stage_id_fkey FOREIGN KEY (to_stage_id) REFERENCES public.blueprint_stages(id);


--
-- Name: blueprints blueprints_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprints
    ADD CONSTRAINT blueprints_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: companies companies_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: contacts contacts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: custom_field_values custom_field_values_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE;


--
-- Name: deals deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: deals deals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: forecast_entries forecast_entries_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_entries
    ADD CONSTRAINT forecast_entries_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: forecast_quotas forecast_quotas_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_quotas
    ADD CONSTRAINT forecast_quotas_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: forecast_snapshots forecast_snapshots_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_snapshots
    ADD CONSTRAINT forecast_snapshots_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: gamification_achievements gamification_achievements_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_achievements
    ADD CONSTRAINT gamification_achievements_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.gamification_badges(id);


--
-- Name: invoices invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.sales_orders(id);


--
-- Name: invoices invoices_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id);


--
-- Name: lead_calls lead_calls_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_calls
    ADD CONSTRAINT lead_calls_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_calls lead_calls_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_calls
    ADD CONSTRAINT lead_calls_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: lead_emails lead_emails_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_emails
    ADD CONSTRAINT lead_emails_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_emails lead_emails_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_emails
    ADD CONSTRAINT lead_emails_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: lead_meetings lead_meetings_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_meetings
    ADD CONSTRAINT lead_meetings_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_meetings lead_meetings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_meetings
    ADD CONSTRAINT lead_meetings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_notes lead_notes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: lead_tasks lead_tasks_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tasks
    ADD CONSTRAINT lead_tasks_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_tasks lead_tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tasks
    ADD CONSTRAINT lead_tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: lead_views lead_views_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_views
    ADD CONSTRAINT lead_views_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: leads leads_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: pipeline_stages pipeline_stages_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: pipeline_stages pipeline_stages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: pipelines pipelines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: price_book_items price_book_items_price_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_book_items
    ADD CONSTRAINT price_book_items_price_book_id_fkey FOREIGN KEY (price_book_id) REFERENCES public.price_books(id) ON DELETE CASCADE;


--
-- Name: price_book_items price_book_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_book_items
    ADD CONSTRAINT price_book_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: quotas quotas_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotas
    ADD CONSTRAINT quotas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: quote_line_items quote_line_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_line_items
    ADD CONSTRAINT quote_line_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: quote_line_items quote_line_items_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_line_items
    ADD CONSTRAINT quote_line_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: quotes quotes_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: quotes quotes_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id);


--
-- Name: roles roles_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.roles(id);


--
-- Name: sales_orders sales_orders_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id);


--
-- Name: sales_orders sales_orders_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id);


--
-- Name: tags tags_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tasks tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: territories territories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.territories
    ADD CONSTRAINT territories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.territories(id);


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: web_form_submissions web_form_submissions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_form_submissions
    ADD CONSTRAINT web_form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.web_forms(id);


--
-- Name: workflow_actions workflow_actions_workflow_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_actions
    ADD CONSTRAINT workflow_actions_workflow_rule_id_fkey FOREIGN KEY (workflow_rule_id) REFERENCES public.workflow_rules(id) ON DELETE CASCADE;


--
-- Name: workflow_executions workflow_executions_workflow_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_workflow_rule_id_fkey FOREIGN KEY (workflow_rule_id) REFERENCES public.workflow_rules(id);


--
-- PostgreSQL database dump complete
--

-- (psql meta-command removed: not valid SQL over a driver connection)

