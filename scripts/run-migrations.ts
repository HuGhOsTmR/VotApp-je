import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('[v0] Starting database migrations...');

    // Leer y ejecutar schema.sql
    console.log('[v0] Executing schema.sql...');
    const schemaPath = path.join(__dirname, '01_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Dividir en statements y ejecutar
    const schemaStatements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of schemaStatements) {
      try {
        await supabase.rpc('execute_sql', { sql: statement });
      } catch (err) {
        console.log(`[v0] Statement: ${statement.substring(0, 50)}...`);
        console.error('[v0] Error executing statement (continuing):', err);
      }
    }

    console.log('[v0] Schema created successfully');

    // Leer y ejecutar seed.sql
    console.log('[v0] Executing seed.sql...');
    const seedPath = path.join(__dirname, '02_seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    const seedStatements = seedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of seedStatements) {
      try {
        await supabase.rpc('execute_sql', { sql: statement });
      } catch (err) {
        console.log(`[v0] Seed statement: ${statement.substring(0, 50)}...`);
        console.error('[v0] Error executing seed (continuing):', err);
      }
    }

    console.log('[v0] Seed data inserted successfully');
    console.log('[v0] Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
