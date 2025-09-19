# Yarn Tracker

Internal yarn production tracking application built with Next.js (App Router) and Supabase. The UI layer now uses Tailwind CSS (v3.4) with [shadcn/ui](https://ui.shadcn.com) components for a consistent design system that aligns with the PRD dashboards, masters, transactions, and reporting workflows.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables by copying `.env.example` to `.env.local` and filling in your Supabase project URL and anon key:
   ```bash
   cp .env.example .env.local
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000` to access the app. The root route redirects to the dashboard, and `http://localhost:3000/login` exposes the Supabase-auth login flow.

## Production Build

To verify the project builds successfully:

```bash
npm run build
```

The current build output (Next.js 14.2.32 with Tailwind v3.4) completes without warnings when Supabase environment variables are set and network access is available for dependency resolution.

## Project Structure

- `app/` – Next.js App Router routes, including the authenticated shell under `app/(app)`.
- `components/` – Application components (`Sidebar`, `TopBar`) and `components/ui/*` generated via shadcn.
- `lib/` – Shared utilities, including the Supabase browser client factory and helper functions.
- `docs/PRD.md` – Full product requirements document for the yarn tracker.

## UI Stack Notes

- Tailwind CSS v3.4 is configured via `tailwind.config.ts` and `postcss.config.js` (using the standard `tailwindcss` PostCSS plugin).
- shadcn/ui components (buttons, cards, tables, forms, sheets, alerts, etc.) are stored in `components/ui` and consumed throughout dashboard, masters, transactions, and reports pages.
- Global tokens (colors, radius) live in `app/globals.css`; extend them as additional themes/variants are required.

## Product Requirements

A detailed Product Requirements Document (PRD) is available at [`docs/PRD.md`](docs/PRD.md). It covers:

- Project goals and target audience
- Role-based access expectations
- Core features for production tracking, BOM management, reporting, and dashboards
- Proposed Supabase schema
- Non-functional requirements and future enhancements

Refer to the PRD when prioritizing new features or refining the Supabase schema and UI workflows.
