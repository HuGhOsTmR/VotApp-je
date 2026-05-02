import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local
function loadEnv() {
  try {
    const envPath = resolve('.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    return envVars;
  } catch (error) {
    console.error('Error loading .env.local:', error);
    return {};
  }
}

const env = loadEnv();

// Configuración de Supabase
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function linkParliamentarians() {
  try {
    console.log('🔗 Linking parliamentarians to users...');

    // Obtener usuarios parlamentarios sin parlamentario asignado
    const { data: unlinkedUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('role', 'parliamentarian')
      .eq('is_active', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${unlinkedUsers.length} parliamentarian users`);

    // Obtener parlamentarios sin user_id asignado
    const { data: availableParliamentarians, error: parliamentariansError } = await supabase
      .from('parliamentarians')
      .select('id, full_name, political_party')
      .is('user_id', null)
      .eq('is_active', true);

    if (parliamentariansError) {
      console.error('Error fetching parliamentarians:', parliamentariansError);
      return;
    }

    console.log(`Found ${availableParliamentarians.length} available parliamentarians`);

    // Vincular usuarios con parlamentarios
    for (let i = 0; i < Math.min(unlinkedUsers.length, availableParliamentarians.length); i++) {
      const user = unlinkedUsers[i];
      const parliamentarian = availableParliamentarians[i];

      console.log(`Linking ${user.full_name} (${user.email}) to ${parliamentarian.full_name} (${parliamentarian.political_party})`);

      const { error: linkError } = await supabase
        .from('parliamentarians')
        .update({ user_id: user.id })
        .eq('id', parliamentarian.id);

      if (linkError) {
        console.error(`Error linking user ${user.id} to parliamentarian ${parliamentarian.id}:`, linkError);
      } else {
        console.log(`✅ Successfully linked`);
      }
    }

    console.log('🎉 Linking process completed!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

linkParliamentarians();