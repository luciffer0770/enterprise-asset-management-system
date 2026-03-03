# Role Permission Matrix

Tool and trolley management with tickets, KPIs, and Excel import/export.

| Capability / Area | Admin | Lab In-Charge | Mechanical | Electrical | External |
|-------------------|-------|---------------|------------|------------|----------|
| Login / view dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View tools (assets) | ✅ (all) | ✅ (all) | ✅ (scoped) | ✅ (scoped) | ✅ (assigned only) |
| Create/update tools | ✅ | ✅ | ✅ (scoped) | ✅ (scoped) | ❌ |
| View trolleys | ✅ | ✅ | ✅ (dept) | ✅ (dept) | ✅ (assigned tools) |
| Issue / return tools (checkout) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve return tickets | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reserve tools | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create work orders | ✅ | ✅ | ✅ (scoped) | ✅ (scoped) | ❌ |
| Edit/close work orders | ✅ | ✅ | ✅ (scoped) | ✅ (scoped) | ❌ |
| Calibration actions | ✅ | View | View | View | View (assigned only) |
| Finance (depreciation/disposal) | ✅ | View-only | View-only | View-only | ❌ |
| Audit logs | ✅ (full) | View (scoped) | View (scoped) | View (scoped) | View (own) |
| Excel import/export | ✅ | ✅ | ✅ | ✅ | View only (no import) |
| Switch role (demo) | ✅ | ❌ | ❌ | ❌ | ❌ |

## Scoping Rules

- **Admin**: Full access to all tenant data
- **Lab In-Charge**: Same as Admin for viewing; can approve return tickets
- **Mechanical**: Access to tools/trolleys where department is Mechanical
- **Electrical**: Access to tools/trolleys where department is Electrical
- **External**: Access only to tools where `assigned_user_id` equals the current user

## Removed Features

- **Mobile scan** – Removed
- **Integrations** (OIDC, SCIM, ERP, etc.) – Removed
