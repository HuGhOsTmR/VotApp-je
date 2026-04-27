#!/usr/bin/env python3
import os
import psycopg2
from psycopg2 import sql
import sys

# Obtener variable de conexión (Supabase proporciona POSTGRES_URL)
postgres_url = os.getenv('POSTGRES_URL')
if not postgres_url:
    print('[v0] Error: POSTGRES_URL environment variable not set')
    sys.exit(1)

try:
    print('[v0] Connecting to Supabase PostgreSQL...')
    conn = psycopg2.connect(postgres_url)
    cur = conn.cursor()
    print('[v0] Connected successfully!')

    # Ejecutar schema.sql
    print('[v0] Executing schema.sql...')
    with open('scripts/01_schema.sql', 'r') as f:
        schema_sql = f.read()
    
    cur.execute(schema_sql)
    conn.commit()
    print('[v0] Schema created successfully!')

    # Ejecutar seed.sql
    print('[v0] Executing seed.sql...')
    with open('scripts/02_seed.sql', 'r') as f:
        seed_sql = f.read()
    
    cur.execute(seed_sql)
    conn.commit()
    print('[v0] Seed data inserted successfully!')

    cur.close()
    conn.close()
    print('[v0] Database setup complete!')

except Exception as e:
    print(f'[v0] Error: {e}')
    sys.exit(1)
