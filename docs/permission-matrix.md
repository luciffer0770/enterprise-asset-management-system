# Role Permission Matrix

| Capability / Area | Admin | Mechanical | Electrical | External |
|-------------------|-------|-----------|------------|----------|
| Login / view dashboard | ✅ | ✅ | ✅ | ✅ |
| View assets | ✅ (all) | ✅ (scoped) | ✅ (scoped) | ✅ (assigned/shared only) |
| Create/update assets | ✅ | ✅ (scoped) | ✅ (scoped) | ❌ |
| Checkout / return | ✅ | ✅ | ✅ | ❌ |
| Reserve assets | ✅ | ✅ | ✅ | ✅ (if enabled) |
| Create work orders | ✅ | ✅ (scoped) | ✅ (scoped) | ❌ |
| Edit/close work orders | ✅ | ✅ (scoped) | ✅ (scoped) | ❌ |
| Calibration actions | ✅ | View | View | View (assigned only) |
| Finance (depreciation/disposal) | ✅ | View-only | View-only | ❌ |
| Audit logs | ✅ (full) | View (scoped) | View (scoped) | View (own actions only) |
| Integrations settings | ✅ | ❌ | ❌ | ❌ |
| SCIM/OIDC admin | ✅ | ❌ | ❌ | ❌ |
| Switch role (demo) | ✅ | ❌ | ❌ | ❌ |

## Scoping Rules

- **Admin**: Full access to all tenant data
- **Mechanical**: Access to assets where `owner_org_unit` is Mechanical
- **Electrical**: Access to assets where `owner_org_unit` is Electrical
- **External**: Access only to assets where `assigned_user_id` equals the current user
