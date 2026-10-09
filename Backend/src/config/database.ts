import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * DATE columns (OID 1082) come back as the plain 'YYYY-MM-DD' string Postgres
 * stores — a calendar day with no time and no zone.
 *
 * node-pg's default turned a DATE into a JavaScript Date at the SERVER's local
 * midnight; from an IST server '2026-05-28' then serialised as
 * "2026-05-27T18:30:00.000Z", so every client that sliced it — or any browser
 * at or west of UTC+4, e.g. the UAE — showed the previous day (data-correctness
 * slice, 2026-10-06). Columns: deals.expected_close_date / start_date /
 * contract_end_date / discovery_date / next_step_due_date, leads.last_contact /
 * expected_close_date, tasks.due_date, quotes.valid_until, invoices.due_date,
 * forecast_snapshots.snapshot_date, user_sales_profiles.ramp_start_date,
 * custom_field_values.value_date. TIMESTAMPTZ is unaffected.
 */
types.setTypeParser(types.builtins.DATE, (v: string) => v);

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bmi_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ PostgreSQL connected:', result.rows[0].version.split(',')[0]);
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
};
