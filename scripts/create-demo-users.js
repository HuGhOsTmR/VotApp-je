import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoUsers = [
  {
    email: 'admin@diputados.bo',
    password: 'Admin123!@#',
    role: 'admin',
    name: 'Administrador Sistema',
  },
  {
    email: 'parlamentario1@diputados.bo',
    password: 'Parl123!@#',
    role: 'parliamentarian',
    name: 'Juan Parlamentario',
  },
  {
    email: 'parlamentario2@diputados.bo',
    password: 'Parl123!@#',
    role: 'parliamentarian',
    name: 'María Diputada',
  },
  {
    email: 'observador@diputados.bo',
    password: 'Obs123!@#',
    role: 'observer',
    name: 'Observador Público',
  },
];

async function createDemoUsers() {
  console.log('[v0] Creating demo users...');

  for (const user of demoUsers) {
    try {
      // Crear usuario en Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        // Si el usuario ya existe, es ok
        if (authError.message.includes('already exists')) {
          console.log(`[v0] User ${user.email} already exists, skipping...`);
          continue;
        }
        throw authError;
      }

      // Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: authUser.user.id,
            email: user.email,
            full_name: user.name,
            role: user.role,
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        console.error(`[v0] Error creating profile for ${user.email}:`, profileError);
        continue;
      }

      console.log(`[v0] ✓ Created user: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`[v0] Error creating user ${user.email}:`, error);
    }
  }

  console.log('[v0] Demo users creation completed!');
  console.log('\n[v0] Demo Account Credentials:');
  demoUsers.forEach((user) => {
    console.log(`  - Email: ${user.email}`);
    console.log(`    Password: ${user.password}`);
    console.log(`    Role: ${user.role}\n`);
  });
}

createDemoUsers().catch((error) => {
  console.error('[v0] Fatal error:', error);
  process.exit(1);
});
