-- Data marketplace foundation for SellerMate2
-- Safe to run in Supabase SQL Editor. Does not modify existing SellerMate tables.

create extension if not exists pgcrypto;

create table if not exists public.marketplace_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_sellers (
  user_id uuid primary key references public.marketplace_profiles(user_id) on delete cascade,
  shop_name text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.data_packages (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.marketplace_sellers(user_id) on delete restrict,
  operator text not null check (operator in ('grameenphone','robi','airtel','banglalink','teletalk')),
  title text not null,
  data_gb numeric(10,2) not null check (data_gb > 0),
  validity_days integer not null check (validity_days > 0),
  price_bdt numeric(12,2) not null check (price_bdt > 0),
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.data_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.marketplace_profiles(user_id) on delete restrict,
  seller_id uuid not null references public.marketplace_sellers(user_id) on delete restrict,
  package_id uuid not null references public.data_packages(id) on delete restrict,
  mobile_number text not null check (mobile_number ~ '^01[3-9][0-9]{8}$'),
  operator text not null,
  data_gb numeric(10,2) not null,
  amount_bdt numeric(12,2) not null check (amount_bdt > 0),
  status text not null default 'pending' check (status in ('pending','paid','processing','delivered','failed','refunded')),
  provider_reference text,
  created_at timestamptz not null default now()
);

create index if not exists data_packages_active_idx on public.data_packages(is_active, operator);
create index if not exists data_packages_seller_idx on public.data_packages(seller_id);
create index if not exists data_orders_buyer_idx on public.data_orders(buyer_id, created_at desc);
create index if not exists data_orders_seller_idx on public.data_orders(seller_id, created_at desc);

alter table public.marketplace_profiles enable row level security;
alter table public.marketplace_sellers enable row level security;
alter table public.data_packages enable row level security;
alter table public.data_orders enable row level security;

drop policy if exists "Users can read own marketplace profile" on public.marketplace_profiles;
create policy "Users can read own marketplace profile"
on public.marketplace_profiles for select
to authenticated using (user_id = auth.uid());

drop policy if exists "Users can create own marketplace profile" on public.marketplace_profiles;
create policy "Users can create own marketplace profile"
on public.marketplace_profiles for insert
to authenticated with check (user_id = auth.uid());

drop policy if exists "Users can update own marketplace profile" on public.marketplace_profiles;
create policy "Users can update own marketplace profile"
on public.marketplace_profiles for update
to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can read own seller application" on public.marketplace_sellers;
create policy "Users can read own seller application"
on public.marketplace_sellers for select
to authenticated using (user_id = auth.uid());

drop policy if exists "Users can apply as seller" on public.marketplace_sellers;
create policy "Users can apply as seller"
on public.marketplace_sellers for insert
to authenticated with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "Anyone can view active data packages" on public.data_packages;
create policy "Anyone can view active data packages"
on public.data_packages for select
to anon, authenticated using (is_active = true);

drop policy if exists "Sellers can view their own packages" on public.data_packages;
create policy "Sellers can view their own packages"
on public.data_packages for select
to authenticated using (seller_id = auth.uid());

drop policy if exists "Approved sellers can add packages" on public.data_packages;
create policy "Approved sellers can add packages"
on public.data_packages for insert
to authenticated with check (
  seller_id = auth.uid()
  and exists (
    select 1 from public.marketplace_sellers s
    where s.user_id = auth.uid() and s.status = 'approved'
  )
  and is_active = false
);

drop policy if exists "Approved sellers can update their packages" on public.data_packages;
create policy "Approved sellers can update their packages"
on public.data_packages for update
to authenticated using (
  seller_id = auth.uid()
  and exists (
    select 1 from public.marketplace_sellers s
    where s.user_id = auth.uid() and s.status = 'approved'
  )
) with check (
  seller_id = auth.uid()
  and exists (
    select 1 from public.marketplace_sellers s
    where s.user_id = auth.uid() and s.status = 'approved'
  )
);

drop policy if exists "Buyers can view their own orders" on public.data_orders;
create policy "Buyers can view their own orders"
on public.data_orders for select
to authenticated using (buyer_id = auth.uid());

drop policy if exists "Sellers can view orders for their packages" on public.data_orders;
create policy "Sellers can view orders for their packages"
on public.data_orders for select
to authenticated using (seller_id = auth.uid());

-- Create a marketplace profile automatically for new signups.
create or replace function public.create_marketplace_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.marketplace_profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_marketplace_profile on auth.users;
create trigger on_auth_user_created_marketplace_profile
after insert on auth.users
for each row execute procedure public.create_marketplace_profile_for_new_user();

-- Orders are created through this function so customers cannot choose or alter prices.
create or replace function public.create_data_order(
  p_package_id uuid,
  p_mobile_number text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_package public.data_packages%rowtype;
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must sign in before ordering';
  end if;

  if p_mobile_number !~ '^01[3-9][0-9]{8}$' then
    raise exception 'Enter a valid Bangladesh mobile number';
  end if;

  select * into v_package
  from public.data_packages
  where id = p_package_id and is_active = true;

  if not found then
    raise exception 'This data package is not available';
  end if;

  insert into public.data_orders (
    buyer_id, seller_id, package_id, mobile_number,
    operator, data_gb, amount_bdt, status
  )
  values (
    auth.uid(), v_package.seller_id, v_package.id, p_mobile_number,
    v_package.operator, v_package.data_gb, v_package.price_bdt, 'pending'
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.create_data_order(uuid, text) from public;
grant execute on function public.create_data_order(uuid, text) to authenticated;

-- No public/client-side order status updates or wallet credits are allowed.
-- Payment gateway and operator delivery integration will be added only after
-- an authorized supplier API and payment provider are confirmed.
