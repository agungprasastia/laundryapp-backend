-- ============================================================
-- Laundry Kinclong — Supabase Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'pelanggan'
              check (role in ('admin', 'pelanggan')),
  phone       text,
  address     text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles RLS
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'pelanggan'),
    coalesce(new.raw_user_meta_data ->> 'phone', null)
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Pakets
create table if not exists public.pakets (
  id          bigint generated always as identity primary key,
  nama_paket  text not null,
  harga       numeric(10,2) not null,
  estimasi    text,
  foto_url    text,
  deskripsi   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.pakets enable row level security;

-- Pakets RLS: public read, admin write
create policy "Anyone can read pakets"
  on public.pakets for select
  using (true);

create policy "Admin can insert pakets"
  on public.pakets for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin can update pakets"
  on public.pakets for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin can delete pakets"
  on public.pakets for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Pesanans
create table if not exists public.pesanans (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  paket_id        bigint not null references public.pakets(id) on delete restrict,
  berat           numeric(8,2) not null default 0,
  total_bayar     numeric(12,2) not null default 0,
  status          text not null default 'Baru'
                  check (status in ('Baru', 'Proses', 'Selesai', 'Diambil')),
  status_bayar    text not null default 'Belum Lunas'
                  check (status_bayar in ('Belum Lunas', 'Menunggu Verifikasi', 'Lunas')),
  tanggal         date not null default current_date,
  tanggal_selesai date,
  catatan         text,
  bukti_bayar_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.pesanans enable row level security;

-- Pesanans RLS
create policy "Pelanggan can read own pesanan"
  on public.pesanans for select
  using (auth.uid() = user_id);

create policy "Pelanggan can insert own pesanan"
  on public.pesanans for insert
  with check (auth.uid() = user_id);

create policy "Admin can read all pesanan"
  on public.pesanans for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin can update any pesanan"
  on public.pesanans for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin can delete any pesanan"
  on public.pesanans for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_pakets_updated_at
  before update on public.pakets
  for each row execute function public.update_updated_at();

create trigger set_pesanans_updated_at
  before update on public.pesanans
  for each row execute function public.update_updated_at();

-- Indexes for common queries
create index idx_pesanans_user_id on public.pesanans(user_id);
create index idx_pesanans_status on public.pesanans(status);
create index idx_pesanans_tanggal on public.pesanans(tanggal);
create index idx_profiles_role on public.profiles(role);

-- ============================================================
-- Storage Buckets (run via Supabase Dashboard or SQL)
-- ============================================================

-- Public bucket for paket photos
insert into storage.buckets (id, name, public)
values ('paket-photos', 'paket-photos', true)
on conflict (id) do nothing;

-- Private bucket for payment proofs
insert into storage.buckets (id, name, public)
values ('bukti-bayar', 'bukti-bayar', false)
on conflict (id) do nothing;

-- Storage policies: paket-photos (public read, admin write)
create policy "Public read paket photos"
  on storage.objects for select
  using (bucket_id = 'paket-photos');

create policy "Admin upload paket photos"
  on storage.objects for insert
  with check (
    bucket_id = 'paket-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin delete paket photos"
  on storage.objects for delete
  using (
    bucket_id = 'paket-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage policies: bukti-bayar (owner upload, owner+admin read)
create policy "Owner upload bukti bayar"
  on storage.objects for insert
  with check (
    bucket_id = 'bukti-bayar'
    and auth.uid() is not null
  );

create policy "Owner or admin read bukti bayar"
  on storage.objects for select
  using (
    bucket_id = 'bukti-bayar'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );
