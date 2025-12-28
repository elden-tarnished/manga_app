create extension if not exists pg_trgm;

create table manga (
	id int primary key,
	main_picture_medium varchar(2047),
	main_picture_large varchar(2047),
	title text,
	english_title text,
	japanese_title text,
	start_date date,
	end_date date,
	synopsis text,
	mean double precision,
	rank int,
	popularity int,
	num_list_users int,
	num_scoring_users int,
	status varchar(255),
	nsfw varchar(50),
	created_at timestamp,
	updated_at timestamp,
	media_type varchar(255),
	num_volumes int,
	num_chapters int,
	background text,
	search_title text generated always as (coalesce(title, '') || ' ' || coalesce(english_title, '')) stored,
	search_title_lower text generated always as (lower(coalesce(title, '') || ' ' || coalesce(english_title, ''))) stored
);

create index idx_test_trgm on manga using gin (search_title_lower gin_trgm_ops);

create table serialization (
	id int primary key,
	name text
);

create table manga_serialization (
	manga_id int references manga(id) on delete cascade,
	serialization_id int references serialization(id) on delete cascade,
	primary key (manga_id, serialization_id)
);

create table manga_synonym (
	manga_id int references manga(id) on delete cascade,
	synonym text,
	primary key (manga_id, synonym)
);

create table genre (
	id int primary key,
	name text,
	type text,
	unique (id, name)
);

create table manga_genre (
	manga_id int references manga(id) on delete cascade,
	genre_id int references genre(id) on delete cascade,
	primary key (manga_id, genre_id)
);

create table picture (
	id serial primary key,
	picture_medium varchar(2047),
	picture_large varchar(2047),
	unique (picture_medium, picture_large)
);

create table manga_picture (
	manga_id int references manga(id) on delete cascade,
	picture_id int references picture(id) on delete cascade,
	primary key (manga_id, picture_id)
);

create table author (
	id int primary key,
	first_name text,
	last_name text,
	unique (id, first_name, last_name)
);

create table manga_author (
	manga_id int references manga(id) on delete cascade,
	author_id int references author(id) on delete cascade,
	role text,
	primary key (manga_id, author_id, role)
);

create table related_manga (
	manga_id int references manga(id) on delete cascade,
	related_manga_id int references manga(id) on delete cascade,
	relation_type varchar(255),
	relation_type_formatted varchar(255),
	primary key (manga_id, related_manga_id)
);

create table recommendation (
	manga_id int references manga(id) on delete cascade,
	recommendation_id int references manga(id) on delete cascade,
	primary key (manga_id, recommendation_id)
);