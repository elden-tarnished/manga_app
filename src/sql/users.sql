create table users (
	id serial primary key ,
	username text unique not null ,
	email text unique not null ,
);
/*
might add: 
	picture text
	name text
	to users table later
*/
create table users_favorites (
	users_id int references users(id) on delete cascade,
	manga_id int references manga(id) on delete cascade,
	primary key (users_id, manga_id)
);