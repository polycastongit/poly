create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  category text,
  status text not null default 'active', -- active | resolved | cancelled
  close_time timestamptz not null,
  base_token text default 'USDC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_markets_status on markets(status);
create index if not exists idx_markets_close_time on markets(close_time);

create table if not exists odds_snapshots (
  id bigserial primary key,
  market_id uuid references markets(id) on delete cascade,
  yes_odds numeric(6,3) not null,
  no_odds numeric(6,3) not null,
  model_version text not null default 'zkml-v0',
  created_at timestamptz not null default now()
);

create table if not exists bets (
  id bigserial primary key,
  market_id uuid references markets(id) on delete cascade,
  wallet text not null,
  side text not null, -- YES | NO
  amount_lamports bigint not null,
  client_tx text,      -- base64 tx returned to client (optional log)
  signature text,      -- filled after user signs/broadcasts (optional)
  status text not null default 'prepared', -- prepared | submitted | settled | failed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bets_market on bets(market_id);
create index if not exists idx_bets_wallet on bets(wallet);

create table if not exists proofs (
  id bigserial primary key,
  market_id uuid references markets(id) on delete cascade,
  bet_id bigint references bets(id) on delete cascade,
  proof_json jsonb not null,
  verified boolean not null default false,
  verifier text not null default 'zkml-prover',
  created_at timestamptz not null default now()
);
