# Secretary Role Implementation TODO

Current working directory: d:/VotApp/VotApp-je

## Approved Plan Steps

### 1. Database Migration [IN PROGRESS]
- [ ] Create scripts/09_secretary_role.sql with:
  - ALTER user_profiles CHECK constraint add 'secretary'
  - CREATE is_secretary() function
  - Update RLS policies for sessions/motions/attendance: INSERT/UPDATE allow is_admin() OR is_secretary()
  - Deny secretary on user_profiles/parliamentarians CRUD
  - CREATE RPC check_quorum_met(session_id)
  - CREATE RPC check_can_vote(motion_id, parliamentarian_id)
- [ ] Run migration: cd scripts && npx supabase db push (or manual psql)

### 2. Types & Constants Update
- [ ] lib/types.ts: Add SECRETARY = 'secretary' to UserRole
- [ ] lib/constants.ts: Add ROLE_LABELS.secretary = 'Secretario', ROLE_PERMISSIONS.secretary = [...]
- [ ] lib/hooks/use-auth.ts: Update ROLE_PERMISSIONS map

### 3. Backend API Guards & Enforcement
- [ ] app/api/motions/route.ts: Replace 'admin' → 'admin' || 'secretary'; add quorum guards
- [ ] app/api/sessions/route.ts: Add secretary access
- [ ] app/api/public/[institution]/attendance/route.ts: Secretary manage
- [ ] app/api/votes/route.ts: Enforce check_can_vote RPC

### 4. Frontend UI & Guards
- [ ] app/secretary/layout.tsx (new, AuthGuard 'secretary')
- [ ] app/secretary/page.tsx (dashboard)
- [ ] app/secretary/sessions/page.tsx, motions/page.tsx, attendance/page.tsx (copy from admin)
- [ ] components/shared/navbar.tsx: Add secretary nav items
- [ ] app/page.tsx, app/auth/login/page.tsx: Add secretary redirects
- [ ] components/auth/auth-guard.tsx: Ensure array support

### 5. Testing & Validation
- [ ] Create test secretary user
- [ ] Test RLS: Secretary can sessions/motions/attndc, cannot users/parl-mgmt
- [ ] Test quorum: Fail open vote <quorum, pass >=quorum + present
- [ ] Test UI: Secretary nav/dashboard, no admin-only links
- [ ] attempt_completion

**Next step:** Create & confirm scripts/09_secretary_role.sql contents.

Updated on: $(date)

