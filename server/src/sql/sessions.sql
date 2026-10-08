-- Session store for connect-pg-simple (used by express-session).
create table session (
	sid varchar not null primary key,
	sess json not null,
	expire timestamp(6) not null
);

create index idx_session_expire on session (expire);
