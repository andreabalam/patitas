-- Adoption requests: one row per adopter-pet request submitted through
-- the "Quiero adoptar" survey (Stage 1 of the adoption pipeline).

create table if not exists adoption_requests (
  id              uuid primary key default gen_random_uuid(),
  pet_id          uuid not null references pets(id) on delete cascade,
  adopter_id      uuid not null references profiles(id) on delete cascade,
  status          text not null default 'pending', -- 'pending' | 'approved' | 'declined'
  survey_answers  jsonb not null,
  created_at      timestamptz not null default now(),

  -- one active request per adopter per pet — resubmission shows a friendly
  -- "already applied" message instead of spamming the volunteer
  unique (pet_id, adopter_id)
);

alter table adoption_requests enable row level security;

-- Adopters can submit and see their own requests
create policy "Adopters can insert their own requests"
  on adoption_requests for insert
  with check (auth.uid() = adopter_id);

create policy "Adopters can view their own requests"
  on adoption_requests for select
  using (auth.uid() = adopter_id);

-- Volunteers can view and update requests for pets they created
create policy "Volunteers can view requests for their pets"
  on adoption_requests for select
  using (
    exists (
      select 1 from pets
      where pets.id = adoption_requests.pet_id
      and pets.created_by = auth.uid()
    )
  );

create policy "Volunteers can update requests for their pets"
  on adoption_requests for update
  using (
    exists (
      select 1 from pets
      where pets.id = adoption_requests.pet_id
      and pets.created_by = auth.uid()
    )
  );
