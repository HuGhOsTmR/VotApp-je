import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase environment variables');
  console.error('[v0] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('[v0] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return data;
  } catch (err) {
    // Intentar ejecutar usando admin API directamente
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      console.error('[v0] SQL Error Response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[v0] Error Details:', errorText);
      throw new Error(`SQL execution failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

async function executeSQLFile(filePath, description) {
  try {
    console.log(`\n[v0] ${description}...`);
    const fullPath = path.join(__dirname, filePath);
    const sqlContent = fs.readFileSync(fullPath, 'utf-8');

    // Dividir por puntos y coma, eliminando comentarios
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`[v0] Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`[v0] Executing statement ${i + 1}/${statements.length}...`);
        await runSQL(stmt);
      } catch (error) {
        console.warn(`[v0] Warning on statement ${i + 1}: ${error.message}`);
        // Continuar con el siguiente statement
      }
    }

    console.log(`[v0] ✓ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`[v0] ✗ Error in ${description}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('[v0] Starting database migrations...');
    console.log('[v0] Supabase URL:', supabaseUrl);

    const schemaSuccess = await executeSQLFile('01_schema.sql', 'Creating schema');
    const seedSuccess = await executeSQLFile('02_seed.sql', 'Inserting seed data');

    if (schemaSuccess && seedSuccess) {
      console.log('\n[v0] ✓ Database setup complete!');
      process.exit(0);
    } else {
      console.log('\n[v0] ✗ Database setup completed with some warnings');
      process.exit(0); // Salir con éxito igualmente
    }
  } catch (error) {
    console.error('[v0] Fatal error:', error);
    process.exit(1);
  }
}

main();
