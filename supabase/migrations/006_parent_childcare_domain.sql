-- Phase 3 childcare domain foundation.
-- Additive schema only: keep existing member number generation and billing tables untouched.

create table cms_childcare_centers (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now(),
  unique (name)
);

create table cms_childcare_classes (
  id uuid primary key,
  center_id uuid not null references cms_childcare_centers(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (center_id, name)
);

create table cms_children (
  id uuid primary key default gen_random_uuid(),
  parent_member_id uuid not null references cms_members(id) on delete cascade,
  class_id uuid not null references cms_childcare_classes(id) on delete restrict,
  name text not null,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into cms_childcare_centers (id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'Morning Star Childcare'),
  ('22222222-2222-2222-2222-222222222222', 'River Kids Center');

insert into cms_childcare_classes (id, center_id, name)
values
  ('11111111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'Sun Class'),
  ('11111111-bbbb-1111-bbbb-111111111111', '11111111-1111-1111-1111-111111111111', 'Moon Class'),
  ('22222222-aaaa-2222-aaaa-222222222222', '22222222-2222-2222-2222-222222222222', 'Star Class');

create index idx_cms_childcare_centers_name on cms_childcare_centers(lower(name));
create index idx_cms_childcare_classes_center_id on cms_childcare_classes(center_id);
create index idx_cms_childcare_classes_name on cms_childcare_classes(lower(name));
create index idx_cms_children_parent_member_id on cms_children(parent_member_id);
create index idx_cms_children_class_id on cms_children(class_id);
create index idx_cms_children_name on cms_children(lower(name));

alter table cms_childcare_centers enable row level security;
alter table cms_childcare_classes enable row level security;
alter table cms_children enable row level security;

create policy "Authenticated users can view childcare centers"
  on cms_childcare_centers for select
  to authenticated
  using (true);

create policy "Authenticated users can view childcare classes"
  on cms_childcare_classes for select
  to authenticated
  using (true);

create policy "Parents can view own children"
  on cms_children for select
  to authenticated
  using ((select auth.uid()) = parent_member_id);

create policy "Parents can insert own children"
  on cms_children for insert
  to authenticated
  with check ((select auth.uid()) = parent_member_id);

create policy "Parents can update own children"
  on cms_children for update
  to authenticated
  using ((select auth.uid()) = parent_member_id)
  with check ((select auth.uid()) = parent_member_id);

create policy "Parents can delete own children"
  on cms_children for delete
  to authenticated
  using ((select auth.uid()) = parent_member_id);
