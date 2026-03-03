# Changelog

## v0.2.0 (current branch: cursor/industrial-tooling-management-1b99)

### Added
- **Trolleys** – Project-based trolleys (Mechanical/Electrical) where tools are mounted
- **Tickets** – Issue/return workflow; return creates approval ticket for Admin/Lab In-Charge
- **Excel import/export** – Import and export tools as .xlsx
- **KPI tiles** – On Tools, Trolleys, and Tickets pages
- **Manual location** – Type location text instead of fixed dropdown
- **Trolley assignment** – Assign tools to trolleys in Add/Edit forms
- **LAB_INCHARGE** role – Can approve return tickets
- **Bosch-style supergraphic** – Header band

### Removed
- **Mobile scan** – Page and all nav links removed
- **Integrations** – Page, API, and IntegrationConfig model removed

### Changed
- **Assets** → **Tools** in UI labels and nav
- **Checkout** → accessible via **Tickets** page (Issue/Return button)
- Return flow: Non-approvers create ReturnTicket (PENDING_APPROVAL); approvers approve/reject
- EXTERNAL role: Now has checkout capability (request tools via tickets)
- Setup: Use `npm run setup` (replaces db:migrate + db:seed)
- run.sh: Uses `npm run setup`

---

## v0.1.0

Initial prototype: Assets, checkout, reservations, work orders, calibration, finance, audit logs.
