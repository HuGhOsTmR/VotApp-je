# Multi-Tenant Architecture Documentation

## Overview

This document describes the multi-tenant refactoring of the Parliamentary Voting System, enabling it to support multiple legislative institutions as a SaaS platform.

---

## 1. Architecture Summary

### 1.1 Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTITUTIONS TABLE                    │
│  (One record per legislative body/customer)           │
├─────────────────────────────────────────────────────┤
│  id              UUID (PK)                           │
│  name            VARCHAR(255)                        │
│  slug            VARCHAR(100) - unique URL identifier   │
│  logo_url        TEXT                                 │
│  configuration  JSONB - white-label settings        │
│  primary_color  VARCHAR(7) - hex color              │
│  public_title  VARCHAR(255) - display title          │
│  is_active     BOOLEAN                               │
│  is_platform   BOOLEAN - platform super-admin       │
│  created_at    TIMESTAMP                             │
└─────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TENANT-OWNED ENTITIES                  │
├─────────────────────────────────────────────────────┤
│  user_profiles      → institution_id (FK)               │
│  parliamentarians → institution_id (FK)              │
│  sessions        → institution_id (FK)              │
│  motions        → institution_id (FK)              │
│  votes           → institution_id (FK)              │
│  attendance     → institution_id (FK)              │
│  audit_logs     → institution_id (FK)              │
└─────────────────────────────────────────────────────┘
```

### 1.2 Role Model

| Role | Scope | Permissions |
|------|------|-------------|
| `platform_admin` | All institutions | Full system access, can create/manage institutions |
| `tenant_admin` | Single institution | Full access within their institution |
| `parliamentarian` | Single institution | Vote and view within their institution |
| `observer` | Single institution | Read-only within their institution |

**Legacy Support:** The existing `admin` role maps to `tenant_admin` for backward compatibility.

---

## 2. Tenant Isolation (RLS)

### 2.1 Database Functions

```sql
-- Get current user's institution_id
current_user_institution_id() → UUID

-- Check role-based access
is_platform_admin() → BOOLEAN
is_tenant_admin() → BOOLEAN
is_parliamentarian() → BOOLEAN
```

### 2.2 RLS Policy Pattern

All tenant-owned tables use this pattern:

```sql
-- Example: Sessions
CREATE POLICY "View sessions by institution" ON sessions
  FOR SELECT USING (
    is_platform_admin() OR 
    institution_id = current_user_institution_id()
  );
```

This ensures users can only access data from their institution, unless they are a platform admin.

---

## 3. Routing & URL Structure

### 3.1 Path-Based Routing (Recommended)

The system supports institution-based paths:

```
/                    → Landing page (institution picker)
/cochabamba/dashboard  → Cochabamba institution dashboard
/cochabamba/sessions  → Cochabamba sessions
/senado/dashboard   → Senate institution dashboard
/senado/sessions     → Senate sessions
```

### 3.2 Subdomain-Based (Future Enhancement)

For production, subdomains can be configured:

```
https://cochabamba.system.com     → Cochabamba
https://senado.system.com      → Senate
```

---

## 4. White-Label Branding

### 4.1 Institution Configuration

Each institution can customize:

| Property | Description | Example |
|----------|------------|----------|
| `logo_url` | Institution logo | `https://cdn.instance.com/logo.png` |
| `primary_color` | Brand accent color | `#1e40af` |
| `public_title` | Public display title | "Parliamentary Voting System" |
| `configuration` | JSONB for custom settings | `{}` |

### 4.2 Dynamic Branding Fetch

```typescript
// Fetch institution branding
const { data: institution } = await supabase
  .from('institutions')
  .select('*')
  .eq('slug', 'cochabamba')
  .single();

// Apply custom branding
document.documentElement.style.setProperty(
  '--primary-color', 
  institution.primary_color
);
```

---

## 5. Migration Strategy

### 5.1 Idempotent Migration

Run migration `06_multi_tenant.sql`:

1. Creates `institutions` table
2. Adds `institution_id` columns to all tenant-owned tables
3. Creates default "cochabamba" institution
4. Backfills existing data to default institution
5. Updates RLS policies for tenant isolation
6. Adds helper functions

### 5.2 Backward Compatibility

- Existing single-institution deployments continue working
- All data is migrated to the default "cochabamba" institution
- Legacy `admin` role maps to `tenant_admin`
- No breaking changes to API contracts

---

## 6. Adding New Institutions

### 6.1 Database Setup

```sql
-- Create new institution
INSERT INTO institutions (
  name,
  slug,
  primary_color,
  public_title
) VALUES (
  'Senate',
  'senado',
  '#059669',
  'Senate Voting System'
);
```

### 6.2 Admin Setup

```sql
-- Make user a tenant admin
UPDATE user_profiles
SET role = 'tenant_admin',
    institution_id = '<institution-id>'
WHERE email = 'senado-admin@company.com';
```

---

## 7. API Changes

### 7.1 Tenant-Aware Queries

All API routes now implicitly filter by institution via RLS:

```typescript
// Sessions API - tenant isolation handled by RLS
const { data } = await supabase
  .from('sessions')
  .select('*')
  // No explicit filter needed - RLS handles it
  .order('session_date', { ascending: false });
```

### 7.2 Cross-Tenant Operations

For platform admin operations:

```sql
-- RPC function to get all institutions
SELECT * FROM get_institution_by_slug('cochabamba');

-- Check platform access
SELECT is_platform_admin();
```

---

## 8. File Changes Summary

### 8.1 New Files

| File | Purpose |
|------|---------|
| `scripts/06_multi_tenant.sql` | Database migration |
| `scripts/07_institution_seed.sql` | Institution seed data |
| `MULTI_TENANT_ARCHITECTURE.md` | This documentation |

### 8.2 Modified Files

| File | Changes |
|------|--------|
| `lib/types.ts` | Added `Institution` type, `institution_id` to all entities |
| `lib/constants.ts` | Added new roles: `PLATFORM_ADMIN`, `TENANT_ADMIN` |
| `lib/hooks/use-auth.ts` | Updated role checking for new roles |

---

## 9. Deployment Checklist

### 9.1 Database Migration

```bash
# Run migration
psql -h your-host -U your-user -d your-database -f scripts/06_multi_tenant.sql

# Run seed data (optional)
psql -h your-host -U your-user -d your-database -f scripts/07_institution_seed.sql

# Verify migration
SELECT name FROM institutions;
```

### 9.2 Application Deployment

```bash
# Build and deploy
pnpm build
pnpm start
```

### 9.3 Verification

1. Test login with existing admin account
2. Verify RLS prevents cross-tenant access
3. Check new institution management (if platform admin)
4. Test branding customization

---

## 10. Security Considerations

### 10.1 Tenant Isolation

- RLS enforces all tenant data access
- No cross-tenant queries possible via API
- Platform admin role required for multi-tenant operations

### 10.2 Audit Trail

- All tenant-owned actions logged with `institution_id`
- Platform admins can view all audit logs
- Tenant admins can only view their institution's logs

---

## 11. Future Enhancements

### 11.1 Planned Features

- Subdomain-based routing
- Institution-specific email templates
- Custom domains per institution
- Usage analytics per institution
- Subscription/billing integration

### 11.2 API Extensions

- Institution CRUD API for platform admins
- Cross-institution reporting
- Institution onboarding flow

---

## 12. Support & Troubleshooting

### 12.1 Common Issues

| Issue | Solution |
|------|----------|
| Users can't see data | Check `institution_id` is set |
| RLS blocking access | Verify user role and institution match |
| Branding not updating | Clear cache, check `configuration` |

### 12.2 Useful Queries

```sql
-- Check user's institution
SELECT up.email, i.name as institution
FROM user_profiles up
JOIN institutions i ON up.institution_id = i.id;

-- Check all tenant data counts
SELECT 
  i.name,
  (SELECT COUNT(*) FROM user_profiles WHERE institution_id = i.id) as users,
  (SELECT COUNT(*) FROM parliamentarians WHERE institution_id = i.id) as parliamentarians,
  (SELECT COUNT(*) FROM sessions WHERE institution_id = i.id) as sessions
FROM institutions i;
```

---

## Conclusion

This refactoring enables the Parliamentary Voting System to operate as a multi-tenant SaaS platform while maintaining full backward compatibility with existing single-institution deployments. The architecture is production-ready and follows best practices for tenant isolation, role-based access control, and white-label customization.
