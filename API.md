# API Documentation - Sistema Parlamentario de Votación

## Base URL
```
http://localhost:3000/api (dev)
https://your-app.vercel.app/api (prod)
```

## Authentication
- **Bearer Token**: Supabase JWT from /auth/login
- Header: `Authorization: Bearer eyJ...`
- RLS & role checks server-side.

## Health Check
```
GET /api/health
```
Test:
```bash
curl http://localhost:3000/api/health
```
Response:
```json
{
  "status": "healthy",
  "checks": {
    "supabase": {"status": "ok"},
    "environment": {"status": "ok"}
  }
}
```

## Users
```
GET /api/users - List all users (admin)
GET /api/users/profile - My profile
```
Test:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/users
```

## Sessions
```
GET /api/sessions - List sessions
POST /api/sessions - Create session (admin/secretary)
PATCH /api/sessions - Update session (body {id, title, status, ...}) (admin/secretary)
DELETE /api/sessions?id={id} - Cancel session (soft-delete) (admin/secretary)
```
Test:
```bash
curl -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"id":"uuid","title":"Updated"}' http://localhost:3000/api/sessions
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/sessions?id=uuid
```

## Motions
```
GET /api/motions - List motions (?session_id=)
POST /api/motions - Create motion (admin/secretary)
GET /api/motions/:motionId - Get motion + results
PATCH /api/motions/:motionId - Update status/timings (admin/secretary)
DELETE /api/motions/:motionId - Delete pending motion no votes (admin/secretary)
```
Test:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/motions
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/motions/motion-uuid
```

## Votes
```
POST /api/votes - Cast vote (parliamentarian)
GET /api/votes/check/:motionId - Check if voted
GET /api/votes/user - My votes
```
Test:
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"motion_id":"id","vote_type":"favor"}' http://localhost:3000/api/votes
```

## Public Endpoints (no auth)
```
GET /api/public/institutions - List institutions
GET /api/public/:institution/sessions - Sessions
GET /api/public/:institution/motions - Motions
GET /api/public/:institution/motions/:motionId/results - Results
GET /api/public/:institution/parliamentarians - List
GET /api/public/:institution/attendance - Attendance
```
Test:
```bash
curl http://localhost:3000/api/public/institutions
curl http://localhost:3000/api/public/scz/sessions # slug 'scz'
```

## Results
```
GET /api/results/:motionId - Vote results
```
Test:
```bash
curl http://localhost:3000/api/results/motion_id_here
```

## Webhooks
```
GET /api/webhooks - List
POST /api/webhooks - Create
PUT /api/webhooks/:id - Toggle
DELETE /api/webhooks/:id
```
Admin only.

## Keys (admin)
```
GET /api/keys - API keys
```

**Run pnpm dev, copy $TOKEN from browser localStorage supabase.auth.token, test above curls.**

**Issues?** Run `pnpm tsc --noEmit`, check logs dev server.
