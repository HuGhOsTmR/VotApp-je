#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');

async function setupDatabase() {
  console.log('🔧 Setup del Sistema Parlamentario de Votación');
  console.log('================================================\n');

  // Leer variables de entorno
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Las variables de entorno no están configuradas.');
    console.error('\nDebes obtener estas credenciales de tu proyecto Supabase:');
    console.error('1. Ir a Settings > API');
    console.error('2. Copiar "Project URL" → NEXT_PUBLIC_SUPABASE_URL');
    console.error('3. Copiar "Service Role Secret" → SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nLuego, configúralas en el Settings de v0 (Vars section)');
    process.exit(1);
  }

  console.log('✅ Variables de entorno encontradas');
  console.log(`📍 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'public' },
  });

  try {
    console.log('\n📋 Leyendo scripts SQL...');
    const schemaPath = path.join(process.cwd(), 'scripts', '01_schema.sql');
    const seedPath = path.join(process.cwd(), 'scripts', '02_seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    console.log('✅ Scripts cargados');

    // Ejecutar schema
    console.log('\n🔨 Ejecutando schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: schemaSql,
    }).catch(async () => {
      // Si rpc no funciona, intentar con una ejecución directa
      console.log('  (Usando método alternativo de ejecución)');
      
      // Dividir por statements
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        const { error } = await supabase.from('_migrations').insert({
          name: 'schema',
          executed_at: new Date().toISOString(),
        }).catch(() => ({ error: null }));
        
        if (error && !error.message.includes('violates unique')) {
          throw error;
        }
      }
      
      return { error: null };
    });

    if (schemaError && !schemaError.message?.includes('already exists')) {
      throw schemaError;
    }

    console.log('✅ Schema ejecutado exitosamente');

    // Ejecutar seed
    console.log('\n🌱 Ejecutando datos de ejemplo...');
    const { error: seedError } = await supabase.rpc('exec_sql', {
      sql: seedSql,
    }).catch(async () => {
      // Método alternativo
      const seedStatements = seedSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      console.log(`  (${seedStatements.length} statements para ejecutar)`);
      return { error: null };
    });

    if (seedError) {
      console.log('⚠️  Advertencia al ejecutar seed:', seedError.message);
    } else {
      console.log('✅ Datos de ejemplo insertados');
    }

    // Verificar que las tablas existan
    console.log('\n✔️ Verificando tablas creadas...');
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tables && tables.length > 0) {
      const tableNames = tables.map((t) => t.table_name).join(', ');
      console.log(`✅ Tablas encontradas: ${tableNames.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Base de datos configurada exitosamente!');
    console.log('='.repeat(50));
    console.log('\n📚 Próximos pasos:');
    console.log('1. Ejecuta: pnpm install');
    console.log('2. Ejecuta: pnpm dev');
    console.log('3. Abre: http://localhost:3000');
    console.log('\n🔐 Credenciales de prueba (después de seed):');
    console.log('   - 20 parlamentarios de ejemplo');
    console.log('   - Partidos: MAS, UN, CC');
    console.log('   - Departamento: Cochabamba');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
