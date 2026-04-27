#!/usr/bin/env node

console.log('🔍 Diagnóstico del Sistema');
console.log('==========================\n');

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allPresent = true;

for (const key of required) {
  const value = process.env[key];
  if (value) {
    const preview = value.substring(0, 20) + '...';
    console.log(`✅ ${key}: ${preview}`);
  } else {
    console.log(`❌ ${key}: NO CONFIGURADA`);
    allPresent = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPresent) {
  console.log('✨ Todas las variables están configuradas!');
  console.log('\nPróximo paso: ejecuta "pnpm db:setup"');
} else {
  console.log('⚠️  Faltan variables de entorno');
  console.log('\nDebes configurarlas en Settings > Vars:');
  console.log('1. NEXT_PUBLIC_SUPABASE_URL');
  console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('3. SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nObtén estas del proyecto Supabase en Settings > API');
}

console.log('='.repeat(50));

process.exit(allPresent ? 0 : 1);
