-- Industrial Tooling & Asset Management - Postgres-flavored schema
-- Use with DATABASE_URL pointing to Postgres for production

create table tenants (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table org_units (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('mechanical','electrical','admin','external')),
  created_at timestamptz not null default now()
);

create table users (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  email text not null,
  display_name text not null,
  password_hash text,
  role text not null check (role in ('ADMIN','MECHANICAL','ELECTRICAL','EXTERNAL')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create table user_org_units (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  org_unit_id text not null references org_units(id) on delete cascade,
  unique (user_id, org_unit_id)
);

create table locations (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  path text,
  created_at timestamptz not null default now()
);

create table inventory_pools (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table asset_types (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  category text not null,
  requires_calibration boolean not null default false
);

create table assets (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  asset_type_id text not null references asset_types(id),
  asset_tag text not null,
  serial_number text,
  lifecycle_state text not null,
  owner_org_unit_id text references org_units(id),
  location_id text references locations(id),
  pool_id text references inventory_pools(id),
  assigned_user_id text references users(id),
  status text not null default 'IN_SERVICE',
  condition text not null default 'GOOD',
  criticality text not null default 'NORMAL',
  purchase_cost double precision,
  purchase_date date,
  warranty_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, asset_tag)
);

create table checkouts (
  id text primary key,
  asset_id text not null references assets(id) on delete cascade,
  borrower_id text not null references users(id),
  checked_out_at timestamptz not null default now(),
  due_date timestamptz,
  returned_at timestamptz,
  condition_out text,
  condition_in text,
  notes text,
  created_at timestamptz not null default now()
);

create table reservations (
  id text primary key,
  asset_id text references assets(id) on delete cascade,
  pool_id text references inventory_pools(id),
  requester_id text not null references users(id),
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'PENDING',
  priority text not null default 'NORMAL',
  created_at timestamptz not null default now()
);

create table work_orders (
  id text primary key,
  asset_id text not null references assets(id) on delete cascade,
  type text not null,
  priority text not null default 'NORMAL',
  status text not null default 'OPEN',
  title text not null,
  description text,
  assigned_to_id text references users(id),
  planned_start timestamptz,
  planned_finish timestamptz,
  completed_at timestamptz,
  downtime_hours double precision,
  labor_cost double precision,
  parts_cost double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table calibration_events (
  id text primary key,
  asset_id text not null references assets(id) on delete cascade,
  scheduled_date timestamptz,
  performed_date timestamptz,
  result text not null,
  certificate_url text,
  next_due_date timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table depreciation_books (
  id text primary key,
  asset_id text not null references assets(id) on delete cascade,
  method text not null,
  useful_life int not null,
  salvage_value double precision,
  start_date timestamptz not null,
  nbv double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table disposal_records (
  id text primary key,
  asset_id text not null unique references assets(id) on delete cascade,
  method text not null,
  disposal_date timestamptz not null,
  proceeds double precision,
  approvals text,
  created_at timestamptz not null default now()
);

create table audit_log_events (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  actor_user_id text references users(id),
  entity_type text not null,
  entity_id text,
  action text not null,
  event_ts timestamptz not null default now(),
  diff_json jsonb not null default '{}'::jsonb,
  ip_address text
);

create table inventory_audits (
  id text primary key,
  tenant_id text not null,
  scope text,
  status text not null default 'IN_PROGRESS',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table inventory_audit_items (
  id text primary key,
  audit_id text not null references inventory_audits(id) on delete cascade,
  asset_id text not null references assets(id) on delete cascade,
  expected boolean not null default true,
  found boolean not null,
  variance text,
  notes text
);

create table integration_configs (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  type text not null,
  enabled boolean not null default false,
  config text not null default '{}',
  last_sync timestamptz,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_assets_tenant_tag on assets(tenant_id, asset_tag);
create index idx_assets_lifecycle on assets(lifecycle_state);
create index idx_checkouts_asset_returned on checkouts(asset_id, returned_at);
create index idx_reservations_asset_dates on reservations(asset_id, start_date, end_date);
create index idx_audit_events_tenant_ts on audit_log_events(tenant_id, event_ts desc);
