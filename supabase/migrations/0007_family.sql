-- Arv — the family dimension. Book members must be able to see each other's
-- name and photo; profiles_select_own alone hid every collaborator. A
-- SECURITY DEFINER helper decides co-membership without recursing through
-- policies, then an extra SELECT policy on profiles ORs it in.

create or replace function shares_book_with(other uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  -- True when auth.uid() and `other` are both members (owner or accepted
  -- contributor) of at least one common book.
  select exists (
    select 1
    from public.books b
    where
      -- I am a member of b
      (
        b.owner_id = auth.uid()
        or exists (
          select 1 from public.book_contributors c
          where c.book_id = b.id and c.user_id = auth.uid() and c.accepted_at is not null
        )
      )
      -- and `other` is a member of b
      and (
        b.owner_id = other
        or exists (
          select 1 from public.book_contributors c2
          where c2.book_id = b.id and c2.user_id = other and c2.accepted_at is not null
        )
      )
  );
$$;

drop policy if exists profiles_read_book_members on profiles;
create policy profiles_read_book_members on profiles
  for select using (shares_book_with(id));
