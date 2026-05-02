# Transactional Vote Integrity and Audit Hardening

## Architecture Overview

This document explains the production-grade transactional vote integrity and audit hardening implementation for the Parliamentary Voting System.

---

## Problem Statement

### Original Issues
1. **Non-Transactional Vote Casting**: Vote creation and audit log creation happened in separate operations, leading to potential data inconsistency if any step failed.
2. **Application-Level Validation**: All validation logic was implemented in the API layer, which is vulnerable to race conditions and bypass attempts.
3. **No Idempotency Protection**: Users could potentially submit multiple votes through rapid double-clicks or concurrent requests.
4. **Incomplete Audit Trail**: Missing critical audit fields like IP address and user agent in some cases.

---

## Solution Architecture

### 1. Database Layer: Atomic Vote Casting (RPC)

The core of the solution is the `cast_vote(...)` PostgreSQL stored procedure that ensures **atomic** execution:

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSACTION BOUNDARY                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │  1. Validate Motion Status                        │   │
│  │  2. Validate Parliamentarian                    │   │
│  │  3. Validate Vote Type                         │   │
│  │  4. Check Authorization                      │   │
│  │  5. Prevent Duplicate Vote (FOR UPDATE lock) │   │
│  │  6. INSERT Vote                              │   │
│  │  7. INSERT Audit Log                        │   │
│  │  8. COMMIT or ROLLBACK                     │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**

- **Single Transaction**: Both vote and audit log are inserted within the same database transaction. If any step fails, the entire operation rolls back.
- **Row-Level Locking**: Uses `FOR UPDATE` to prevent race conditions when checking for duplicate votes.
- **Comprehensive Validation**: All validation happens on the database server, preventing bypass.
- **Security DEFINER**: Runs with elevated privileges to allow proper authorization checks.

### 2. Audit Completeness

The RPC function records all required audit information:

| Field | Source | Purpose |
|-------|--------|---------|
| `user_id` | `auth.uid()` | Authenticated user |
| `parliamentarian_id` | Function parameter | Voter identity |
| `motion_id` | Function parameter | Vote target |
| `vote_type` | Function parameter | Vote choice |
| `timestamp` | `NOW()` | Exact vote time |
| `ip_address` | Function parameter | Client IP (for geo-audit) |
| `user_agent` | Function parameter | Client browser |
| `details` | JSONB | Extended context |

### 3. API Layer Refactor

The API route now delegates to the RPC function:

```typescript
// Old approach (multiple queries, non-transactional)
1. SELECT motion status → validate
2. SELECT parliamentarian → validate
3. SELECT existing vote → validate
4. INSERT vote
(If INSERT fails, audit never happens = data inconsistency!)

// New approach (single RPC call, transactional)
await supabase.rpc('cast_vote', { 
  p_motion_id, 
  p_parliamentarian_id, 
  p_vote_type, 
  p_ip_address, 
  p_user_agent 
})
(Both vote and audit insert in one atomic operation!)
```

**Error Handling:**

The API maps database error codes to appropriate HTTP status codes:

| Database Error | HTTP Status | Description |
|----------------|------------|-------------|
| `motion_not_found` | 404 | Motion doesn't exist |
| `motion_not_open` | 400 | Voting not open |
| `duplicate_vote` | 409 | Already voted (idempotent) |
| `unauthorized` | 403 | Not authorized |

### 4. Frontend Idempotency

Protects against rapid double-clicks and concurrent submissions:

```typescript
// State management
const [hasVoted, setHasVoted] = useState(false);
const submitInProgress = useRef(false);

// Before submission
if (submitInProgress.current || hasVoted) return;

// After successful vote
setHasVoted(true);
submitInProgress.current = false;
```

---

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User        │     │  Next.js     │     │  Supabase   │
│  Interface  │────▶│  API Route   │────▶│  RPC        │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │  Transaction │
                                          │  - Validate │
                                          │  - Insert   │
                                          │    Vote     │
                                          │  - Insert   │
                                          │    Audit    │
                                          └──────────────┘
```

---

## Security Considerations

### 1. Row-Level Security
- Direct INSERT to votes table is restricted via RLS policies.
- Application MUST use the RPC function, which runs with `SECURITY DEFINER`.

### 2. Authorization
- The RPC verifies the parliamentarian is linked to the authenticated user.
- Prevents "vote as another parliamentarian" attacks.

### 3. Race Condition Prevention
- `FOR UPDATE` lock on duplicate vote check prevents TOCTOU (Time-of-check to time-of-use) bugs.

### 4. Input Validation
- Vote type validated against enum in database.
- Motion status checked atomically with vote insertion.

---

## Migration Instructions

To deploy this update:

1. **Run the SQL migration:**
   ```bash
   psql -h your-host -U your-user -d your-database -f scripts/04_transactional_vote_casting.sql
   ```

2. **Verify the function exists:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'cast_vote';
   ```

3. **Test the RPC:**
   ```sql
   SELECT cast_vote(
     'motion-uuid',
     'parliamentarian-uuid',
     'favor',
     '192.168.1.1',
     'Mozilla/5.0...'
   );
   ```

4. **Deploy the application:**
   ```bash
   pnpm build
   pnpm start
   ```

---

## File Changes Summary

| File | Change |
|------|-------|
| `scripts/04_transactional_vote_casting.sql` | New RPC procedure |
| `app/api/votes/route.ts` | Call RPC instead of INSERT |
| `components/parliamentarian/voting-interface.tsx` | Idempotency protection |

---

## Rollback Plan

If issues arise, the old implementation can be restored by:

1. Reverting `app/api/votes/route.ts` to the previous version
2. The database RPC can be kept but unused
3. No schema changes need to be reverted

---

## Monitoring Recommendations

Monitor these metrics:

- Vote submission success rate
- Duplicate vote error rate (should be low)
- Vote-to-audit log ratio (should be 1:1)
- Average vote submission latency
