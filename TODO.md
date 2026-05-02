# Ecosystem & Public Transparency Features - TODO

## Implementation Plan

### Phase 1: Database Infrastructure
- [ ] 1.1 Create database migration for API keys and webhook configs
- [ ] 1.2 Add public_visibility flag to institutions table
- [ ] 1.3 Create api_keys table
- [ ] 1.4 Create webhooks table
- [ ] 1.5 Create rate limiting helper functions

### Phase 2: Public API Routes
- [ ] 2.1 /api/public/institutions - Public institution info
- [ ] 2.2 /api/public/[institution]/sessions - Public sessions
- [ ] 2.3 /api/public/[institution]/motions - Public motions (open/closed only)
- [ ] 2.4 /api/public/[institution]/motions/[id]/results - Vote results
- [ ] 2.5 /api/public/[institution]/parliamentarians - Public profiles
- [ ] 2.6 /api/public/[institution]/attendance - Session attendance
- [ ] 2.7 /api/public/[institution]/analytics - Historical summaries

### Phase 3: API Key & Rate Limiting
- [ ] 3.1 API key validation middleware
- [ ] 3.2 Rate limiting per API key/institution
- [ ] 3.3 Rate limit headers in responses

### Phase 4: Webhooks / Event System
- [ ] 4.1 Webhook trigger functions (motion_opened, vote_cast, motion_closed, session_finalized)
- [ ] 4.2 Webhook delivery service
- [ ] 4.3 Webhook retry logic
- [ ] 4.4 Webhook management API (admin only)

### Phase 5: Public Portal Enhancements
- [ ] 5.1 Enhanced public dashboard with search/filter
- [ ] 5.2 Dedicated motion history page
- [ ] 5.3 Parliamentarian profiles page
- [ ] 5.4 Session archive page
- [ ] 5.5 Improved responsiveness

### Phase 6: Open Data Export
- [ ] 6.1 /api/public/export/motions - CSV/JSON export
- [ ] 6.2 /api/public/export/votes - CSV/JSON export
- [ ] 6.3 /api/public/export/parliamentarians - CSV/JSON export
- [ ] 6.4 Bulk export with date range filters

### Phase 7: External Embeds / Widgets
- [ ] 7.1 Embeddable live vote board component
- [ ] 7.2 Motion results card component
- [ ] 7.3 Parliamentarian voting profile widget
- [ ] 7.4 Widget configuration options
- [ ] 7.5 Iframe embed endpoints

### Phase 8: Documentation
- [ ] 8.1 OpenAPI/Swagger configuration
- [ ] 8.2 API documentation page
- [ ] 8.3 Rate limit documentation
- [ ] 8.4 Examples for each endpoint

### Phase 9: Security & Privacy
- [ ] 9.1 Ensure no internal/admin fields leak
- [ ] 9.2 Implement public-safe field filtering
- [ ] 9.3 Validate institution public_visibility setting
- [ ] 9.4 Add security headers

## Dependencies
- None required (uses existing Supabase)
- All new code is additive

## Testing Checklist
- [ ] Public API returns only public-safe data
- [ ] Rate limiting works correctly
- [ ] Webhooks fire on events
- [ ] Embed widgets work on external sites
- [ ] Export endpoints produce valid CSV/JSON
