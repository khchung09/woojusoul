-- Paw 반려동물 커뮤니티 스키마

-- 사용자 프로필
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 반려동물
create table if not exists public.pets (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  species text not null, -- 'dog', 'cat', 'other'
  breed text,
  age int,
  photo_url text,
  created_at timestamptz default now() not null
);

-- 게시물
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  post_type text not null default 'general', -- 'general' | 'report' | 'temp_protect' | 'adoption'
  location text,          -- 제보: 발견 위치
  animal_type text,       -- 제보: 'cat' | 'dog' | 'other'
  animal_status text,     -- 제보: 'rescue_needed' | 'protected' | 'rescued'
  likes_count int default 0 not null,
  comments_count int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 댓글
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- 좋아요
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (post_id, user_id)
);

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

-- profiles RLS
create policy "프로필은 누구나 볼 수 있음" on public.profiles for select using (true);
create policy "본인 프로필만 수정 가능" on public.profiles for update using (auth.uid() = id);

-- pets RLS
create policy "반려동물 목록은 누구나 볼 수 있음" on public.pets for select using (true);
create policy "본인 반려동물만 등록 가능" on public.pets for insert with check (auth.uid() = owner_id);
create policy "본인 반려동물만 수정 가능" on public.pets for update using (auth.uid() = owner_id);
create policy "본인 반려동물만 삭제 가능" on public.pets for delete using (auth.uid() = owner_id);

-- posts RLS
create policy "게시물은 누구나 볼 수 있음" on public.posts for select using (true);
create policy "로그인한 사용자만 게시 가능" on public.posts for insert with check (auth.uid() = author_id);
create policy "본인 게시물만 수정 가능" on public.posts for update using (auth.uid() = author_id);
create policy "본인 게시물만 삭제 가능" on public.posts for delete using (auth.uid() = author_id);

-- comments RLS
create policy "댓글은 누구나 볼 수 있음" on public.comments for select using (true);
create policy "로그인한 사용자만 댓글 작성 가능" on public.comments for insert with check (auth.uid() = author_id);
create policy "본인 댓글만 삭제 가능" on public.comments for delete using (auth.uid() = author_id);

-- likes RLS
create policy "좋아요는 누구나 볼 수 있음" on public.likes for select using (true);
create policy "로그인한 사용자만 좋아요 가능" on public.likes for insert with check (auth.uid() = user_id);
create policy "본인 좋아요만 취소 가능" on public.likes for delete using (auth.uid() = user_id);

-- 신규 가입 시 프로필 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 좋아요 수 자동 업데이트 트리거
create or replace function public.update_likes_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create or replace trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.update_likes_count();

-- 댓글 수 자동 업데이트 트리거
create or replace function public.update_comments_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = comments_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create or replace trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.update_comments_count();
