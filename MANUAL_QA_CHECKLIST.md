# Solar CRM Manual QA Checklist

## 1. Auth and Session
- Login with valid credentials and confirm redirect to `/dashboard`.
- Refresh browser and confirm authenticated session persists.
- Logout and confirm redirect to `/login`.
- Trigger token expiration flow and confirm refresh token path still restores session.

## 2. Role Access
- Developer: can access all CRM routes (`/dashboard`, `/leads`, `/clients`, `/products`, `/chats`, `/contracts`, `/notifications`, `/integrations`, `/ai-settings`, `/logs`, `/users`).
- Admin: blocked from developer-only routes (`/integrations`, `/ai-settings`, `/logs`) and can access operational + users routes.
- Operator: blocked from system/developer routes and can access operational routes only.
- Direct URL access to unauthorized route should redirect to access-denied or safe fallback.

## 3. Module Flows (CRUD and Lists)
- Leads: list, filters, detail panel, create, edit, delete, status update.
- Clients: list, search, detail panel, create, edit, delete.
- Products: products/categories/brands list and create/edit/delete flows, image operations.
- Contracts: list, search, detail panel, create, edit, delete.
- Notifications: list/filter/pagination, detail open, mark read, bulk mark all read, bulk clear.
- Users: list/filter/pagination, detail panel, create/edit/delete, active toggle, permission listing.
- AI Settings: list/filter, create/edit/delete, set active.
- Integrations: configs and events tabs, search/filter/order, create/edit/delete config, active toggle.
- Logs: list/filter/pagination, health block rendering, cleanup settings update.
- Dashboard: KPI blocks, charts, date range and interval filters.

## 4. Chat Contract Checks
- Session list loads via `GET /api/chat/sessions/`.
- Session detail loads via `GET /api/chat/sessions/{id}/`.
- Session messages load via `GET /api/chat/sessions/{id}/messages/`.
- Sending message uses `POST /api/chat/messages/inbound/`.
- No Telegram WebApp routes are present in CRM navigation or router.

## 5. Runtime/Build Gates
- `npm run typecheck` passes.
- `npm run build` passes.
- Verify `.env` values (`VITE_API_BASE_URL`, `VITE_API_PROXY_TARGET`, `VITE_API_USE_PROXY`) for the target backend.
- Verify Vercel deployment uses correct API target and protected routes resolve without hydration/routing errors.
