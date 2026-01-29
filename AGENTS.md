# AGENTS.md

Project: Dive Workshop (Next.js App Router + Prisma + Postgres)

## Quick map
- App routes: `app/`
  - Public: `/` (access code)
  - Auth: `/admin-login`
  - Admin: `/admin/*`
  - Participant app: `/app`
  - Learning API: `/api/learning`
  - API: `app/api/*`
- UI components: `components/`
  - Admin utilities: `components/admin/*`
    - Shared forms: `components/admin/forms/*`
    - Reorder picker: `components/admin/orderable-picker.tsx`
  - ImagiCharm UI: `components/imagicharm/*`
  - Shadcn UI: `components/ui/*`
- Database:
  - Schema: `prisma/schema.prisma`
  - Config: `prisma.config.ts`
  - Seed: `prisma/seed.mjs`
  - Migrations: `prisma/migrations/*`

## Core conventions
- **Auth**: Session cookie `dive_session` (httpOnly). Session records stored in `Session` table.
- **Participant sessions**: `Session.classId` ties participants to their class.
- **Server access**: Admin area is protected in `app/admin/layout.tsx` (redirects if no session).
- **API access**: All admin APIs check auth via `getAdminFromRequest()` in `lib/auth.ts`.
- **Naming**: CamelCase in Prisma models/fields (e.g. `fullName`).
- **UI reuse**: Use `components/admin/page-header.tsx` and `components/admin/data-table.tsx` for list pages.
- **Participant app**: `/app` is protected via `app/app/layout.tsx` using participant sessions.

## Adding new admin list pages
1) Add DB model in `prisma/schema.prisma`.
2) Add API routes in `app/api/<resource>/route.ts` and `app/api/<resource>/[id]/route.ts`.
3) Add admin pages:
   - List: `app/admin/<resource>/page.tsx`
   - Create: `app/admin/<resource>/new/page.tsx`
   - Edit: `app/admin/<resource>/[id]/page.tsx`
4) Add sidebar link in `app/admin/layout.tsx`.
5) Run migrations:
   - `npx prisma migrate dev --name <name>`
   - `npx prisma generate`

## Data table usage (standardized)
Use `DataTable` to keep the same styling and action behavior:
```tsx
<DataTable
  data={items}
  columns={[
    { header: "Name", cell: (item) => <span>{item.name}</span> },
  ]}
  actions={{
    editHref: (item) => `/admin/items/${item.id}`,
    onDelete: (item) => handleDelete(item.id),
    deleteDialogTitle: "Delete item?",
    deleteDialogDescription: "This action cannot be undone."
  }}
/>
```

## Prevent common errors
- **Next.js dynamic APIs**: `cookies()` and `params` are async in App Router.
  - Always `const cookieStore = await cookies()` before `.get()`.
  - For route handlers, use `{ params }: { params: Promise<{ id: string }> }` and `const { id } = await params`.
- **Prisma 7**:
  - DB URL is in `prisma.config.ts`, not in `schema.prisma`.
  - After schema changes: run `npx prisma migrate dev` then `npx prisma generate`.
- **Auth cookie mutation**:
  - Only set/clear cookies in Route Handlers or Server Actions (e.g. `/api/admin-login`, `/api/logout`).
  - Do **not** mutate cookies in layouts or server components.
- **Admin APIs**: Always check auth at the top:
  ```ts
  const admin = await getAdminFromRequest()
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  ```

## Auth flow summary
- Login (admin): `POST /api/admin-login` verifies password, creates **admin** session, sets cookie.
- Login (participant): `POST /api/participant-login` verifies class access code, creates **participant** session with `classId`, sets cookie.
- Logout: `POST /api/logout` deletes session and clears cookie.
- Admin pages: `app/admin/layout.tsx` redirects to `/admin-login` when no valid session.
- Participant app: `app/app/layout.tsx` redirects to `/` when no valid participant session.

## Modules + blocks
- **Modules**: `Module` has `name` (admin-only) and `title` (learner-facing), plus ordered blocks via `ModuleBlock.order`.
- **Blocks**: `Block` has `type` (`text` | `code`), `title`, `description`, `body` (rich text).
- **Course modules**: `Course` ↔ `Module` is many-to-many via `CourseModule.order` (order matters).
- **Admin forms**: New/edit pages now use shared form components in `components/admin/forms/*`.
- **Reordering**: Use `components/admin/orderable-picker.tsx` for ordered selection UI.

## Participant learning app
- Learning content is derived from `/api/learning` (class → course → ordered modules → ordered blocks).
- Sidebar groups by module title; blocks are consumed in order with Back/Next.
- Code blocks show rich text + code editor/emulator (`components/imagicharm/learning-code-task.tsx`).

## Seeds / local setup
1) `docker compose up -d`
2) `npx prisma migrate dev --name init`
3) `npx prisma generate`
4) `npm run prisma:seed`
5) `npm run dev`

Default admin:
- Email: `test@example.com`
- Password: `test123`

## UI additions
- Use shadcn components via CLI (e.g. `npx shadcn@latest add <component>`).
- Keep table/list layouts consistent with the admin reference design.

## ImagiCharm playground (participant app)
- Editor + emulator live in `/app`.
- Python is executed **client-side** using Pyodide:
  - Loader: `lib/pyodide/loader.ts`
  - Python shim for `open_imagilib` / `imagilib`: `lib/imagicharm/python.ts`
  - Runtime bridge: `lib/imagicharm/runtime.ts`
  - Types: `lib/imagicharm/types.ts`
- Emulator UI: `components/imagicharm/Emulator.tsx`
- Editor UI: `components/imagicharm/Editor.tsx`
- Playground wrapper: `components/imagicharm/Playground.tsx`
- Learning code task: `components/imagicharm/learning-code-task.tsx`
- Tooltips/completions/signatures:
  - `lib/imagicharm/signatures.ts`
  - `lib/imagicharm/completions.ts`
  - `lib/imagicharm/tooltips.ts`

## Tests
- Test runner: `vitest` (`npm run test`)
- Example test: `tests/imagicharm/emulator.test.tsx`

## Notes / gotchas
- Pyodide returns Maps for dicts; runtime normalizes them in `lib/imagicharm/runtime.ts`.
- Emulation updates every frame; keep Editor memoized to avoid tooltip flicker.
- Only use `render()` in Python to push frames to the emulator.
