create table users (
	id serial primary key,
	username text unique not null,
	email text unique not null,
	password text
);

create table users_favorites (
	user_id int references users(id) on delete cascade,
	manga_id int references manga(id) on delete cascade,
	primary key (user_id, manga_id)
);
