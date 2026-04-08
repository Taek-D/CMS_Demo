-- Ensure member_no generation works under RLS and concurrent signups.

create or replace function generate_member_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  seq_num integer;
begin
  if new.member_no is not null then
    return new;
  end if;

  prefix := 'MEM-' || to_char(now(), 'YYYYMM') || '-';

  perform pg_advisory_xact_lock(hashtext(prefix));

  select coalesce(max(right(member_no, 5)::integer), 0) + 1
    into seq_num
  from public.cms_members
  where member_no like prefix || '%';

  new.member_no := prefix || lpad(seq_num::text, 5, '0');
  return new;
end;
$$;
