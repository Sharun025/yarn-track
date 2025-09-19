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
