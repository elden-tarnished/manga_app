-- Attempt counters for login / signup (middleware/rateLimit.js).
-- One row per "route:ip"; the counter starts over once reset_at has passed.
create table rate_limit (
	key text primary key,
	hits int not null,
	reset_at timestamptz not null
);

create index idx_rate_limit_reset_at on rate_limit (reset_at);
