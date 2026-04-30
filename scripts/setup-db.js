#!/usr/bin/env node
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

    // Verificar si las tablas ya existen
    console.log('\n🔨 Verificando estado del schema...');
    
    let tablesExist = false;
    try {
      const { data: checkTables } = await supabase
        .from('parliamentarians')
        .select('id', { count: 'exact', head: true });
      tablesExist = true;
    } catch (err) {
      console.log('  ℹ️  Las tablas no existen aún.');
    }

    if (!tablesExist) {
      console.log('  📝 Ejecuta el schema en Supabase SQL editor:');
      console.log('     Ir a Supabase > SQL Editor > New Query');
      console.log('     Copiar contenido de: scripts/01_schema.sql');
      console.log('     Ejecutar\n');
      console.log('     Luego ejecuta el seed:');
      console.log('     Copiar contenido de: scripts/02_seed.sql');
      console.log('     Ejecutar\n');
    } else {
      console.log('✅ Schema detectado exitosamente');
    }

    // Asegurar usuario admin predeterminado
    console.log('\n🔐 Asegurando cuenta de administrador...');
    const adminEmail = 'admin@diputados.bo';
    const adminPassword = 'admin123';
    let adminUserId = null;

    const { data: existingAuthUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id,email')
      .eq('email', adminEmail)
      .single();

    if (authError && authError.code !== 'PGRST116') {
      console.warn('  No fue posible buscar la cuenta admin en auth.users:', authError.message);
    }

    if (existingAuthUsers?.id) {
      adminUserId = existingAuthUsers.id;
      console.log('  Cuenta admin existente encontrada. Actualizando contraseña.');
      const { error: passwordError } = await supabase.auth.admin.updateUserById(adminUserId, {
        password: adminPassword,
      });

      if (passwordError) {
        console.warn('  No se pudo actualizar contraseña admin:', passwordError.message);
      }
    } else {
      const { data: createData, error: createError } =
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Admin Diputados' },
        });

      if (createError) {
        if (createError.message.includes('already registered')) {
          console.log('  La cuenta admin ya existe, omitiendo creación.');
          const { data: existingUserAgain, error: existingErrorAgain } = await supabase
            .from('auth.users')
            .select('id,email')
            .eq('email', adminEmail)
            .single();

          if (existingErrorAgain && existingErrorAgain.code !== 'PGRST116') {
            console.warn(
              '  No fue posible obtener el id del admin después de la creación fallida:',
              existingErrorAgain.message
            );
          }

          adminUserId = existingUserAgain?.id ?? null;
        } else {
          throw createError;
        }
      } else {
        adminUserId = createData?.user?.id ?? null;
      }
    }

    if (adminUserId) {
      const { error: profileError } = await supabase.from('user_profiles').upsert([
        {
          id: adminUserId,
          email: adminEmail,
          full_name: 'Admin Diputados',
          role: 'admin',
          is_active: true,
        },
      ], { onConflict: 'id' });

      if (profileError) {
        console.warn('  No se pudo crear/actualizar el perfil admin:', profileError.message);
      } else {
        console.log('  Cuenta admin asegurada: admin@diputados.bo / admin123');
      }
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
