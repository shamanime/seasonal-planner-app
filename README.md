# Family Activity Calendar

A Supabase dogfooding app for publishing a curated family activity calendar, letting users clone it, customize their own family copy, and share a kiosk-friendly link.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, RLS, and SSR session handling

## Local Setup

1. Install [mise](https://mise.jdx.dev/), then install the pinned runtime and project dependencies:

```bash
mise install
mise run setup
```

All project commands are defined as mise tasks. Run `mise tasks` to list them.

2. Create a Supabase project at https://supabase.com/dashboard.

3. Log in to Supabase from the CLI:

```bash
mise run supabase:login
```

4. Link this local project to your Supabase project:

```bash
mise run supabase:link -- --project-ref your-project-ref
```

5. Push the migrations to Supabase:

```bash
mise run db:push
```

6. Copy `.env.example` to `.env.local` and fill in your project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

7. In Supabase Dashboard, go to **Authentication > URL Configuration** and set:

```txt
Site URL: http://localhost:3000
Redirect URLs:
http://localhost:3000/auth/callback
```

8. Start the app:

```bash
mise run dev
```

If Supabase env vars are not loading, run this non-secret check. It prints only whether each value is present and its character length:

```bash
mise run check-env
```

9. Sign in once at `/login` so your `profiles` row is created.

10. Promote yourself to admin in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

11. Visit `/admin` to edit the main public template.

## Schema Changes

Create new migrations instead of editing already-applied migrations:

```bash
mise run migration:new -- add_activity_images
```

Then edit the generated file in `supabase/migrations/` and push it:

```bash
mise run db:push
```

Useful CLI commands:

```bash
mise run db:diff
mise run db:reset
mise run supabase:start  # local services; requires Docker
mise run supabase:stop
```

## Routes

- `/` public calendar template and clone CTA
- `/login` Supabase magic-link sign in
- `/dashboard` user's family calendars
- `/calendar/[id]/edit` owner-only family calendar editor
- `/c/[slug]` public shared calendar view
- `/c/[slug]/kiosk` kiosk-friendly read-only view
- `/admin` admin editor for the main template

## Supabase Notes

- RLS is enabled on all app tables.
- Public users can read only published templates and public shared calendars.
- Authenticated users can create and edit only their own family calendars.
- Admin access is controlled by `profiles.role = 'admin'`.
- Existing family calendar copies do not change when the admin edits the main template.

## Later Dogfooding Ideas

- Supabase Storage for activity images and generated assets.
- Edge Functions for event scraping and import review.
- Scheduled Functions for recurring event refreshes.
- Realtime for live kiosk updates.
- PostGIS for location-aware suggestions.
- pgvector for personalized activity recommendations.
