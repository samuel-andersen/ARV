-- Arv — capture the real order on checkout (copies, amount, currency).
-- Idempotent; recipient_name / recipient_address / gift_note already exist.

alter table orders add column if not exists copies int not null default 1;
alter table orders add column if not exists amount_cents int;
alter table orders add column if not exists currency text not null default 'nok';

notify pgrst, 'reload schema';
