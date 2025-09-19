# Supabase setup

The SQL migrations in this directory create the backend schema for the Yarn Tracker project. Apply them with the Supabase CLI or through the dashboard:

```bash
supabase migration up
```

If you prefer the SQL editor, copy the contents of the migration file and run it in your project. Remember to configure the following environment variables in `.env.local` for the application server:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These keys must come from the same Supabase project you run the migrations against.

## Demo seed data

To populate processes, items, BOM templates, example batches, and recent movements, run the seed script after the migration:

```bash
supabase db exec supabase/seed/001_demo_seed.sql
```

The script is idempotent (uses `ON CONFLICT`) so it can be re-run safely. For profiles, replace the placeholder UUIDs at the bottom of the seed file with actual `auth.users.id` values generated for your team accounts before executing that section.

### Creating initial users

1. Invite users through the Supabase Dashboard (`Authentication → Users → Invite`).
2. Once a user confirms the invitation, copy their `id` from the user record.
3. Insert a matching row into `public.profiles` with the desired `role` (`admin`, `manager`, or `supervisor`). You can use the helper snippet at the end of the seed file or run a manual `insert` via the SQL editor.

Without a profile row, RLS policies will prevent the user from accessing data even after sign-in.
