import { pool } from './database';

const createTables = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'sales' CHECK (role IN ('admin','manager','sales','hr')),
        department VARCHAR(100),
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255),
        industry VARCHAR(100),
        company_size VARCHAR(20),
        annual_revenue NUMERIC(15,2),
        website TEXT,
        phone VARCHAR(50),
        description TEXT,
        address JSONB,
        owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        mobile VARCHAR(50),
        position VARCHAR(100),
        department VARCHAR(100),
        linkedin_url TEXT,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        position VARCHAR(100),
        industry VARCHAR(100),
        stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','closed-won','closed-lost','disqualified')),
        score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
        source VARCHAR(100),
        owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        tags JSONB DEFAULT '[]',
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pipelines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#6B7280',
        position INTEGER NOT NULL,
        probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
        is_closed_won BOOLEAN DEFAULT false,
        is_closed_lost BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
        stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
        amount NUMERIC(15,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        closing_date DATE,
        probability INTEGER DEFAULT 0,
        win_prob_ai INTEGER DEFAULT 0,
        win_prob_override_reason TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','won','lost','archived')),
        deal_type VARCHAR(50) DEFAULT 'new-business',
        description TEXT,
        tags JSONB DEFAULT '[]',
        custom_fields JSONB DEFAULT '{}',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add win_prob columns to existing deals tables (idempotent)
    await client.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS win_prob_ai INTEGER DEFAULT 0`);
    await client.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS win_prob_override_reason TEXT`);

    await client.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS value_history JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS momentum_score VARCHAR(20) DEFAULT NULL`);

    // Migration 001: structured next-step fields
    await client.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_step_due_date DATE`);
    // Migration 002: is_test flag — excludes dev/debug records from production views
    await client.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false`);

    // Migration 003: per-rep per-quarter quota targets
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotas (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rep_name      VARCHAR(255) NOT NULL,
        period_label  VARCHAR(20)  NOT NULL,
        quota_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(rep_name, period_label)
      )
    `);

    // Migration 004: forecast snapshots for slippage and commit accuracy
    await client.query(`
      CREATE TABLE IF NOT EXISTS forecast_snapshots (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_label  VARCHAR(20)   NOT NULL,
        snapshot_date DATE          NOT NULL DEFAULT CURRENT_DATE,
        rep_name      VARCHAR(255)  NOT NULL,
        pipeline      NUMERIC(15,2) NOT NULL DEFAULT 0,
        best_case     NUMERIC(15,2) NOT NULL DEFAULT 0,
        commit        NUMERIC(15,2) NOT NULL DEFAULT 0,
        closed        NUMERIC(15,2) NOT NULL DEFAULT 0,
        deal_count    INTEGER       NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ   DEFAULT NOW(),
        UNIQUE(period_label, rep_name, snapshot_date)
      )
    `);
    await client.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_step_owner TEXT`);
    await client.query(`
      ALTER TABLE deals
        ADD COLUMN IF NOT EXISTS next_step_status TEXT DEFAULT 'pending'
          CHECK (next_step_status IN ('pending','done','overdue'))
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'call' CHECK (type IN ('call','email','meeting','task','note','demo','proposal')),
        status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned','completed','cancelled')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
        description TEXT,
        outcome TEXT,
        scheduled_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','in-progress','completed','cancelled')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
        due_date DATE,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ All tables created successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables().catch(console.error);
