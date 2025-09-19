# Yarn Tracker Product Requirements Document (PRD)

## 1. Project Overview

The yarn tracker is an internal production tracking system for factory teams. Authenticated users can log in, manage production processes, track the bill of materials (BOM) for each process, and generate production and efficiency reports.

- **Frontend:** Next.js
- **Backend:** Supabase (authentication, database, API)
- **Hosting:** Vercel or internal infrastructure
- **Authentication:** Supabase Auth (email/password, with optional SSO)
- **Audience:** Factory supervisors, production managers, and administrative staff

---

## 2. Goals

- Centralize yarn production tracking within one system.
- Maintain BOM records for each production stage.
- Provide real-time visibility of yarn movement across processes.
- Generate detailed reports on production efficiency, costs, and usage.
- Enforce secure, role-based access.

---

## 3. User Roles and Permissions

- **Admin:** Manage users, edit processes, configure BOM templates, view all reports.
- **Supervisor:** Log production data, track movement, submit BOM consumption.
- **Manager:** View production dashboards, generate and download reports.

---

## 4. Core Features

### A. Authentication
- Supabase Auth using email and password.
- Role-based access managed through a Supabase `profiles` table.
- Secure session management across devices.

### B. Production Process Tracking
- Define multiple processes (e.g., Spinning, Twisting, Dyeing, Weaving, Packing).
- Each process requires an associated BOM (materials, quantities, costs).
- Ability to log material input, process start and end times, output quantity, and quality status.
- Track movement between processes (for example, spinning output becomes twisting input).

### C. Bill of Materials (BOM)
- Full CRUD operations for BOM templates.
- Attach BOM data to each production batch.
- Validate that required inputs are captured before advancing a batch.

### D. Reports
- Generate daily, weekly, and monthly production summaries.
- Compare BOM consumption with actual usage.
- Produce efficiency reports (input versus output).
- Export reports to CSV or PDF.

### E. Dashboards
- Provide a process status view showing each batch location.
- Display real-time KPIs such as efficiency percentage, wastage percentage, and machine utilization.

---

## 5. Database Schema (Supabase)

- `users` (managed by Supabase Auth)
- `profiles` (`id`, `role`, `name`, references `users.id`)
- `processes` (`id`, `name`, `description`)
- `batches` (`id`, `process_id`, `status`, `start_time`, `end_time`)
- `bom_templates` (`id`, `process_id`, `item_name`, `required_qty`, `unit`)
- `bom_usage` (`id`, `batch_id`, `item_name`, `actual_qty`, `unit`)
- `reports` (generated on demand, not stored permanently)

---

## 6. Non-Functional Requirements

- **Security:** Role-based authorization and Supabase Row Level Security (RLS).
- **Scalability:** Designed to serve multiple factories and large data volumes.
- **Usability:** Mobile-friendly UI suitable for factory floor usage.
- **Performance:** Reports must load in under three seconds for up to 10,000 records.

---

## 7. Future Enhancements (Phase 2)

- Barcode or QR code tracking for batches.
- IoT sensor integrations for machine status monitoring.
- Predictive analytics for yarn wastage and process optimization.
̀