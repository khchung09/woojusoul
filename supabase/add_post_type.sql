-- Supabase 대시보드 SQL 에디터에서 실행하세요
alter table public.posts
  add column if not exists post_type text not null default 'general',
  add column if not exists location text,
  add column if not exists animal_type text,
  add column if not exists animal_status text;
