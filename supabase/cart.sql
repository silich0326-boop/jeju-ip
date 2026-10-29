-- 장바구니 테이블 (Supabase > SQL Editor 에 통째로 붙여 넣고 Ctrl+Enter)
-- 여러 번 실행해도 괜찮아요.

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id  text not null,
  quantity    integer not null default 1 check (quantity between 1 and 99),
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- 로그인한 사용자는 "자기 장바구니"만 보고 고칠 수 있게 막아요 (RLS)
alter table public.cart_items enable row level security;

grant select, insert, update, delete on public.cart_items to authenticated;

drop policy if exists "cart_select_own" on public.cart_items;
drop policy if exists "cart_insert_own" on public.cart_items;
drop policy if exists "cart_update_own" on public.cart_items;
drop policy if exists "cart_delete_own" on public.cart_items;

create policy "cart_select_own" on public.cart_items
  for select to authenticated using (auth.uid() = user_id);
create policy "cart_insert_own" on public.cart_items
  for insert to authenticated with check (auth.uid() = user_id);
create policy "cart_update_own" on public.cart_items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart_delete_own" on public.cart_items
  for delete to authenticated using (auth.uid() = user_id);
