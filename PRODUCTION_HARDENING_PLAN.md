# Production Hardening Plan - Parliamentarian Voting System

## Overview
Implement pilot-ready production hardening with comprehensive error handling, loading states, confirmations, and operational safeguards for live parliamentary deployment.

---

## 1. Health & Diagnostics Infrastructure

### 1.1 Health Check Endpoint (`/api/health/route.ts`)
**Purpose**: Verify Supabase connectivity and environment readiness

**Implementation**:
- Create new endpoint that tests Supabase connection
- Return connection status, latency, and environment info
- Include environment variable validation

### 1.2 Frontend Logger Utility
**Purpose**: Structured logging for frontend errors

**Implementation**: 
- Create `lib/logger.ts` with console logging wrapper
- Add timestamp, level, context for all critical operations
- Integrate with existing console patterns

### 1.3 Connection Status Component
**Purpose**: Show realtime connected/disconnected indicator

**Implementation**:
- Create `components/shared/connection-status.tsx`
- Use Supabase realtime channel state
- Display in navbar with color indicator

---

## 2. Error Handling & Loading States

### 2.1 Error Boundary Component
**Purpose**: Catch and display errors gracefully

**Implementation**:
- Wrap key routes with error boundary
- Show user-friendly messages
- Provide retry actions

### 2.2 Enhanced Loading States
**Purpose**: Better loading feedback

**Implementation**:
- Add loading spinners to all async actions
- Disable buttons during submission
- Show loading in button during API calls

### 2.3 Enhanced Empty States
**Purpose**: Handle no-data scenarios properly

**Implementation**:
- Add proper fallbacks for:
  - No active session
  - No active motion  
  - No parliamentarians
  - No vote data

### 2.4 Network Error Handling
**Purpose**: Graceful offline handling

**Implementation**:
- Show network error toasts
- Queue votes for retry (when applicable)
- Display offline indicator

---

## 3. Admin Safety Workflows

### 3.1 Session Closure Confirmation
**Purpose**: Prevent accidental session closure

**Implementation**:
- Add AlertDialog before closing session
- Warn if active open motions exist
- Require double confirmation for destructive actions

### 3.2 Motion Closure Confirmation
**Purpose**: Prevent accidental motion closure

**Implementation**:
- Confirmation dialog with vote summary
- Warn about final results before closing

### 3.3 Motion State Validation
**Purpose**: Prevent invalid state transitions

**Implementation**:
- Block closing session with active open motions
- Show warning with motion count
- Require explicit confirmation

---

## 4. Realtime Connection Status

### 4.1 Connection Indicator
**Purpose**: Visual realtime status

**Implementation**:
- Green dot: Connected
- Yellow dot: Reconnecting
- Red dot: Disconnected

### 4.2 Auth Context Integration
**Purpose**: Track connection in auth

**Implementation**:
- Add `isConnected` to useAuth hook
- Auto-reconnect on disconnect

---

## 5. Mobile & Responsive Reliability

### 5.1 Voting Interface Mobile
**Purpose**: Touch-optimized voting

**Implementation**:
- Larger touch targets (min 48px)
- Better padding for fingers
- Optimized button layout for tablet

### 5.2 Responsive Vote Buttons
**Purpose**: Full-width on mobile

**Implementation**:
- Stack buttons vertically on phone
- Full width touch targets
- Clear visual feedback

---

## 6. Operational Dashboard Polish

### 6.1 Admin Workflow Improvements
**Purpose**: Better admin operations

**Implementation**:
- Better status badges
- Action confirmation tooltips
- Clear action buttons

### 6.2 Diagnostic Logging
**Purpose**: Structured error tracking

**Implementation**:
- Add `[SYSTEM]` prefix for critical logs
- Include context in all API errors
- Consistent error format

---

## File Changes Summary

### New Files to Create:
1. `app/api/health/route.ts` - Health check endpoint
2. `lib/logger.ts` - Frontend logger utility
3. `components/shared/connection-status.tsx` - Connection indicator

### Files to Edit:
1. `app/layout.tsx` - Add error boundary, connection status
2. `app/auth/login/page.tsx` - Loading states, error handling
3. `app/parliamentarian/voting/page.tsx` - Better empty states, network handling
4. `components/parliamentarian/voting-interface.tsx` - Mobile optimization
5. `components/admin/sessions-table.tsx` - Confirmation dialogs
6. `components/admin/motions-table.tsx` - Confirmation dialogs
7. `lib/hooks/use-auth.ts` - Add connection status
8. `app/public/page.tsx` - Connection status indicator

### Migrate SQL Functions (if needed):
- Create health check SQL function

---

## Dependencies & Order

### Phase Order:
1. First: Health check + Logger (infrastructure)
2. Second: Connection status (depends on logger)
3. Third: Error boundaries (depends on infrastructure)
4. Fourth: Admin workflows (depends on dialog)
5. Fifth: Mobile optimization (independent)
6. Sixth: Final polish

### External Dependencies:
- Supabase client (existing)
- Existing UI components (shadcn)
- Existing toast hooks

---

## Success Criteria

- All async actions have loading indicators
- All errors show user-friendly messages
- All destructive actions require confirmation
- Connection status visible in navbar
- Health check returns proper status
- Mobile voting works reliably
- No silent failures in critical operations
