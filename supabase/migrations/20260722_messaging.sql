-- In-app messaging: one conversation per adoption request, created lazily
-- the first time either side opens the thread.

create table if not exists conversations (
  id                   uuid primary key default gen_random_uuid(),
  adoption_request_id  uuid not null references adoption_requests(id) on delete cascade unique,
  created_at           timestamptz not null default now()
);

create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid references profiles(id),
  body             text not null,
  created_at       timestamptz not null default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

-- A participant is the request's adopter or the request's pet's volunteer.
create policy "Participants can view their conversation"
  on conversations for select
  using (
    exists (
      select 1 from adoption_requests ar
      join pets p on p.id = ar.pet_id
      where ar.id = conversations.adoption_request_id
      and (ar.adopter_id = auth.uid() or p.created_by = auth.uid())
    )
  );

create policy "Participants can create their conversation"
  on conversations for insert
  with check (
    exists (
      select 1 from adoption_requests ar
      join pets p on p.id = ar.pet_id
      where ar.id = conversations.adoption_request_id
      and (ar.adopter_id = auth.uid() or p.created_by = auth.uid())
    )
  );

create policy "Participants can view messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      join adoption_requests ar on ar.id = c.adoption_request_id
      join pets p on p.id = ar.pet_id
      where c.id = messages.conversation_id
      and (ar.adopter_id = auth.uid() or p.created_by = auth.uid())
    )
  );

create policy "Participants can send messages"
  on messages for insert
  with check (
    exists (
      select 1 from conversations c
      join adoption_requests ar on ar.id = c.adoption_request_id
      join pets p on p.id = ar.pet_id
      where c.id = messages.conversation_id
      and (ar.adopter_id = auth.uid() or p.created_by = auth.uid())
    )
  );

-- Needed so Supabase Realtime broadcasts inserts to subscribed clients.
alter publication supabase_realtime add table messages;
