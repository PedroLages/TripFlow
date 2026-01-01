-- TripFlow Database Schema for Supabase
-- Version: 1.0.0
--
-- This schema creates all tables needed for TripFlow with:
-- - Row Level Security (RLS) for collaborative access
-- - Triggers for automatic timestamp updates
-- - Proper indexes for performance
--
-- To deploy: Copy this entire file into Supabase SQL Editor and run

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase Auth)
-- ============================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  home_location text,
  preferred_currency text default 'USD',
  theme text default 'light' check (theme in ('light', 'dark')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TRIPS TABLE
-- ============================================

create table if not exists public.trips (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  destinations text[] default '{}',
  start_date date not null,
  end_date date not null,
  trip_type text default 'Solo' check (trip_type in ('Solo', 'Couple', 'Family', 'Friends', 'Business')),
  cover_image text,
  description text,
  budget numeric(12,2) default 0,
  currency text default 'USD',
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TRIP MEMBERS (Collaborators)
-- ============================================

create table if not exists public.trip_members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'Viewer' check (role in ('Editor', 'Viewer')),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique(trip_id, user_id)
);

-- ============================================
-- DAY PLANS (Itinerary Days)
-- ============================================

create table if not exists public.day_plans (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(trip_id, date)
);

-- ============================================
-- ACTIVITIES (Itinerary Items)
-- ============================================

create table if not exists public.activities (
  id uuid default uuid_generate_v4() primary key,
  day_plan_id uuid references public.day_plans(id) on delete cascade not null,
  activity_type text default 'Custom' check (activity_type in (
    'Attraction', 'Restaurant', 'Transportation', 'Accommodation', 'Tour', 'Free time', 'Custom'
  )),
  name text not null,
  start_time time,
  end_time time,
  location text,
  notes text,
  cost numeric(10,2) default 0,
  icon_name text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- EXPENSES
-- ============================================

create table if not exists public.expenses (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  amount numeric(12,2) not null,
  category text not null check (category in (
    'Flights', 'Accommodation', 'Food', 'Activities', 'Transport', 'Shopping', 'Other'
  )),
  date date not null,
  notes text,
  currency text default 'USD',
  -- Split expense fields
  is_split boolean default false,
  paid_by uuid references public.profiles(id),
  split_method text check (split_method in ('equal', 'custom', 'percentage', 'shares')),
  -- Created by tracking
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- EXPENSE SPLITS (Per-person split details)
-- ============================================

create table if not exists public.expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null,
  percentage numeric(5,2),
  shares integer,
  is_paid boolean default false,
  paid_at timestamptz,
  amount_paid numeric(12,2) default 0,
  created_at timestamptz default now(),
  unique(expense_id, user_id)
);

-- ============================================
-- PAYMENT HISTORY (Partial payments)
-- ============================================

create table if not exists public.payment_history (
  id uuid default uuid_generate_v4() primary key,
  expense_split_id uuid references public.expense_splits(id) on delete cascade not null,
  amount numeric(12,2) not null,
  paid_at timestamptz default now(),
  notes text,
  method text check (method in ('cash', 'card', 'transfer', 'other'))
);

-- ============================================
-- SETTLEMENTS
-- ============================================

create table if not exists public.settlements (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  from_user uuid references public.profiles(id) on delete cascade not null,
  to_user uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null,
  currency text default 'USD',
  status text default 'pending' check (status in ('pending', 'completed')),
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ============================================
-- PACKING ITEMS
-- ============================================

create table if not exists public.packing_items (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  name text not null,
  category text,
  is_packed boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- WISHLIST PLACES
-- ============================================

create table if not exists public.wishlist_places (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  name text not null,
  category text default 'Maybe' check (category in ('Must See', 'Maybe', 'Restaurant', 'Shopping')),
  notes text,
  rating integer default 0 check (rating >= 0 and rating <= 5),
  -- Geocoded location (for map display)
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz default now()
);

-- ============================================
-- TRAVEL DOCUMENTS
-- ============================================

create table if not exists public.travel_documents (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  doc_type text not null check (doc_type in ('Flight', 'Hotel', 'Car', 'Insurance', 'Contact')),
  title text not null,
  details text,
  confirmation text,
  price numeric(10,2),
  date date,
  status text,
  gate text,
  last_updated timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- TRAVEL ALERTS
-- ============================================

create table if not exists public.travel_alerts (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  alert_type text not null check (alert_type in ('Flight', 'Event', 'Strike', 'Weather')),
  title text not null,
  description text,
  severity text default 'Low' check (severity in ('Low', 'Medium', 'High')),
  date date,
  created_at timestamptz default now()
);

-- ============================================
-- ACTIVITY LOGS (Audit trail)
-- ============================================

create table if not exists public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  timestamp timestamptz default now()
);

-- ============================================
-- RECEIPT IMAGES (Stored in Supabase Storage)
-- ============================================

create table if not exists public.receipt_images (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes integer,
  thumbnail_path text,
  uploaded_at timestamptz default now()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

create index if not exists idx_trips_owner_id on public.trips(owner_id);
create index if not exists idx_trips_dates on public.trips(start_date, end_date);
create index if not exists idx_trip_members_user_id on public.trip_members(user_id);
create index if not exists idx_trip_members_trip_id on public.trip_members(trip_id);
create index if not exists idx_day_plans_trip_date on public.day_plans(trip_id, date);
create index if not exists idx_activities_day_plan on public.activities(day_plan_id);
create index if not exists idx_expenses_trip_id on public.expenses(trip_id);
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_expense_splits_expense on public.expense_splits(expense_id);
create index if not exists idx_expense_splits_user on public.expense_splits(user_id);
create index if not exists idx_settlements_trip on public.settlements(trip_id);
create index if not exists idx_packing_items_trip on public.packing_items(trip_id);
create index if not exists idx_wishlist_trip on public.wishlist_places(trip_id);
create index if not exists idx_documents_trip on public.travel_documents(trip_id);
create index if not exists idx_alerts_trip on public.travel_alerts(trip_id);
create index if not exists idx_activity_logs_trip on public.activity_logs(trip_id);
create index if not exists idx_receipt_images_expense on public.receipt_images(expense_id);

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers to relevant tables
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_trips_updated_at
  before update on public.trips
  for each row execute function update_updated_at_column();

create trigger update_day_plans_updated_at
  before update on public.day_plans
  for each row execute function update_updated_at_column();

create trigger update_activities_updated_at
  before update on public.activities
  for each row execute function update_updated_at_column();

create trigger update_expenses_updated_at
  before update on public.expenses
  for each row execute function update_updated_at_column();

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.day_plans enable row level security;
alter table public.activities enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.payment_history enable row level security;
alter table public.settlements enable row level security;
alter table public.packing_items enable row level security;
alter table public.wishlist_places enable row level security;
alter table public.travel_documents enable row level security;
alter table public.travel_alerts enable row level security;
alter table public.activity_logs enable row level security;
alter table public.receipt_images enable row level security;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view all profiles (for collaboration features)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can insert their own profile (fallback for trigger)
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ============================================
-- TRIPS POLICIES
-- ============================================

-- View trips: owner OR member
create policy "Users can view trips they own or are members of"
  on public.trips for select
  to authenticated
  using (
    owner_id = auth.uid()
    or
    id in (
      select trip_id from public.trip_members
      where user_id = auth.uid()
    )
  );

-- Create trips: any authenticated user
create policy "Authenticated users can create trips"
  on public.trips for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Update trips: owner or editor member
create policy "Owners and editors can update trips"
  on public.trips for update
  to authenticated
  using (
    owner_id = auth.uid()
    or
    id in (
      select trip_id from public.trip_members
      where user_id = auth.uid() and role = 'Editor'
    )
  );

-- Delete trips: owner only
create policy "Only owners can delete trips"
  on public.trips for delete
  to authenticated
  using (owner_id = auth.uid());

-- ============================================
-- TRIP MEMBERS POLICIES
-- ============================================

-- View trip members: if you're the owner or a member
create policy "Members can view other members"
  on public.trip_members for select
  to authenticated
  using (
    trip_id in (
      select id from public.trips where owner_id = auth.uid()
      union
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );

-- Owner can add members
create policy "Owners can add members"
  on public.trip_members for insert
  to authenticated
  with check (
    trip_id in (select id from public.trips where owner_id = auth.uid())
  );

-- Owner can update member roles
create policy "Owners can update members"
  on public.trip_members for update
  to authenticated
  using (
    trip_id in (select id from public.trips where owner_id = auth.uid())
  );

-- Owner can remove members
create policy "Owners can remove members"
  on public.trip_members for delete
  to authenticated
  using (
    trip_id in (select id from public.trips where owner_id = auth.uid())
  );

-- ============================================
-- HELPER FUNCTION: Check if user has trip access
-- ============================================

create or replace function user_has_trip_access(trip_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.trips where id = trip_uuid and owner_id = auth.uid()
  ) or exists (
    select 1 from public.trip_members where trip_id = trip_uuid and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

create or replace function user_can_edit_trip(trip_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.trips where id = trip_uuid and owner_id = auth.uid()
  ) or exists (
    select 1 from public.trip_members where trip_id = trip_uuid and user_id = auth.uid() and role = 'Editor'
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- DAY PLANS POLICIES
-- ============================================

create policy "Users can view day plans of their trips"
  on public.day_plans for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Editors can create day plans"
  on public.day_plans for insert
  to authenticated
  with check (user_can_edit_trip(trip_id));

create policy "Editors can update day plans"
  on public.day_plans for update
  to authenticated
  using (user_can_edit_trip(trip_id));

create policy "Editors can delete day plans"
  on public.day_plans for delete
  to authenticated
  using (user_can_edit_trip(trip_id));

-- ============================================
-- ACTIVITIES POLICIES
-- ============================================

create policy "Users can view activities of their trips"
  on public.activities for select
  to authenticated
  using (
    day_plan_id in (
      select id from public.day_plans where user_has_trip_access(trip_id)
    )
  );

create policy "Editors can create activities"
  on public.activities for insert
  to authenticated
  with check (
    day_plan_id in (
      select id from public.day_plans where user_can_edit_trip(trip_id)
    )
  );

create policy "Editors can update activities"
  on public.activities for update
  to authenticated
  using (
    day_plan_id in (
      select id from public.day_plans where user_can_edit_trip(trip_id)
    )
  );

create policy "Editors can delete activities"
  on public.activities for delete
  to authenticated
  using (
    day_plan_id in (
      select id from public.day_plans where user_can_edit_trip(trip_id)
    )
  );

-- ============================================
-- EXPENSES POLICIES
-- ============================================

create policy "Users can view expenses of their trips"
  on public.expenses for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Editors can create expenses"
  on public.expenses for insert
  to authenticated
  with check (user_can_edit_trip(trip_id) and created_by = auth.uid());

create policy "Expense creators and owners can update"
  on public.expenses for update
  to authenticated
  using (
    created_by = auth.uid()
    or trip_id in (select id from public.trips where owner_id = auth.uid())
  );

create policy "Expense creators and owners can delete"
  on public.expenses for delete
  to authenticated
  using (
    created_by = auth.uid()
    or trip_id in (select id from public.trips where owner_id = auth.uid())
  );

-- ============================================
-- EXPENSE SPLITS POLICIES
-- ============================================

create policy "Users can view expense splits"
  on public.expense_splits for select
  to authenticated
  using (
    expense_id in (
      select id from public.expenses where user_has_trip_access(trip_id)
    )
  );

create policy "Editors can manage expense splits"
  on public.expense_splits for all
  to authenticated
  using (
    expense_id in (
      select id from public.expenses where user_can_edit_trip(trip_id)
    )
  );

-- ============================================
-- PAYMENT HISTORY POLICIES
-- ============================================

create policy "Users can view payment history"
  on public.payment_history for select
  to authenticated
  using (
    expense_split_id in (
      select es.id from public.expense_splits es
      join public.expenses e on es.expense_id = e.id
      where user_has_trip_access(e.trip_id)
    )
  );

create policy "Editors can manage payment history"
  on public.payment_history for all
  to authenticated
  using (
    expense_split_id in (
      select es.id from public.expense_splits es
      join public.expenses e on es.expense_id = e.id
      where user_can_edit_trip(e.trip_id)
    )
  );

-- ============================================
-- SETTLEMENTS POLICIES
-- ============================================

create policy "Users can view settlements"
  on public.settlements for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Editors can manage settlements"
  on public.settlements for all
  to authenticated
  using (user_can_edit_trip(trip_id));

-- ============================================
-- PACKING ITEMS POLICIES
-- ============================================

create policy "Users can view packing items"
  on public.packing_items for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Editors can manage packing items"
  on public.packing_items for all
  to authenticated
  using (user_can_edit_trip(trip_id));

-- ============================================
-- WISHLIST PLACES POLICIES
-- ============================================

create policy "Users can view wishlist places"
  on public.wishlist_places for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Editors can manage wishlist places"
  on public.wishlist_places for all
  to authenticated
  using (user_can_edit_trip(trip_id));

-- ============================================
-- TRAVEL DOCUMENTS POLICIES
-- ============================================

create policy "Users can view travel documents"
  on public.travel_documents for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Editors can manage travel documents"
  on public.travel_documents for all
  to authenticated
  using (user_can_edit_trip(trip_id));

-- ============================================
-- TRAVEL ALERTS POLICIES
-- ============================================

create policy "Users can view travel alerts"
  on public.travel_alerts for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Editors can manage travel alerts"
  on public.travel_alerts for all
  to authenticated
  using (user_can_edit_trip(trip_id));

-- ============================================
-- ACTIVITY LOGS POLICIES
-- ============================================

create policy "Users can view activity logs"
  on public.activity_logs for select
  to authenticated
  using (user_has_trip_access(trip_id));

create policy "Authenticated users can create activity logs"
  on public.activity_logs for insert
  to authenticated
  with check (user_has_trip_access(trip_id) and user_id = auth.uid());

-- ============================================
-- RECEIPT IMAGES POLICIES
-- ============================================

create policy "Users can view receipt images"
  on public.receipt_images for select
  to authenticated
  using (
    expense_id in (
      select id from public.expenses where user_has_trip_access(trip_id)
    )
  );

create policy "Editors can manage receipt images"
  on public.receipt_images for all
  to authenticated
  using (
    expense_id in (
      select id from public.expenses where user_can_edit_trip(trip_id)
    )
  );

-- ============================================
-- STORAGE BUCKET SETUP (run separately in Storage settings)
-- ============================================

-- Create storage bucket for receipts:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'receipts',
--   'receipts',
--   false,
--   10485760,  -- 10MB limit
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
-- );

-- Storage policies (run in Storage settings):
--
-- Policy: Users can upload receipts
-- CREATE POLICY "Users can upload receipts"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );
--
-- Policy: Users can view their receipts
-- CREATE POLICY "Users can view own receipts"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );
--
-- Policy: Users can delete their receipts
-- CREATE POLICY "Users can delete own receipts"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- ============================================
-- REALTIME CONFIGURATION
-- ============================================

-- Enable realtime for collaborative tables
-- Run this in Supabase Dashboard > Database > Replication:
-- Enable tables: trips, trip_members, expenses, expense_splits, settlements, activities

-- ============================================
-- END OF SCHEMA
-- ============================================
