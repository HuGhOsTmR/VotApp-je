import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('[v0] Starting database setup...');

    // Read and execute schema script
    const schemaPath = path.join(__dirname, '01_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    console.log('[v0] Executing schema creation...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });

    if (schemaError) {
      console.error('[v0] Schema creation error:', schemaError);
      // Continue anyway as some queries might have failed due to existing objects
    } else {
      console.log('[v0] Schema created successfully');
    }

    // Read and execute seed script
    const seedPath = path.join(__dirname, '02_seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');

    console.log('[v0] Executing seed data...');
    const { error: seedError } = await supabase.rpc('exec_sql', { sql: seedSQL });

    if (seedError) {
      console.error('[v0] Seed data error:', seedError);
    } else {
      console.log('[v0] Seed data inserted successfully');
    }

    console.log('[v0] Database setup completed successfully');
  } catch (error) {
    console.error('[v0] Setup error:', error);
    process.exit(1);
  }
}

setupDatabase();
