-- Create diet_plans table to store user diet plans
create extension if not exists pgcrypto;

create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  goal text not null check (goal in ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain')),
  daily_calories integer not null,
  daily_protein integer not null,
  daily_carbs integer not null,
  daily_fat integer not null,
  weekly_plan jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diet_plans_user_id_idx on public.diet_plans (user_id);
create index if not exists diet_plans_active_idx on public.diet_plans (user_id, is_active);

-- Enable Row Level Security
alter table public.diet_plans enable row level security;

-- Policies: authenticated users can CRUD their own plans
DROP POLICY IF EXISTS "Diet plans are readable by owner" ON public.diet_plans;
CREATE POLICY "Diet plans are readable by owner" ON public.diet_plans
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Diet plans can be inserted by owner" ON public.diet_plans;
CREATE POLICY "Diet plans can be inserted by owner" ON public.diet_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Diet plans can be updated by owner" ON public.diet_plans;
CREATE POLICY "Diet plans can be updated by owner" ON public.diet_plans
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Diet plans can be deleted by owner" ON public.diet_plans;
CREATE POLICY "Diet plans can be deleted by owner" ON public.diet_plans
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());