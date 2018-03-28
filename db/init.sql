drop schema if exists public cascade;

begin;
create schema if not exists public;

create table roles (
    role_id serial primary key,
    title text not null,
    perm integer not null 
);

insert into roles(title, perm)
    values ('Student', 1), ('Admin', 9);

create table _users (
    id serial primary key,
    password text not null ,
    student_id text unique not null,
    nickname varchar(30) unique not null,
    realname varchar(30) not null,
    role_id integer not null default 1 REFERENCES roles(role_id) ON DELETE CASCADE,
    since timestamp default current_timestamp
);

insert into _users(student_id, password, nickname, realname, role_id)
    values ('000000', '123465', 'SunriseFox', 'System Admin', 2);

create view users AS
    select  _users.id as uid, md5(_users.password) as password, _users.student_id, _users.nickname, _users.realname,
        _users.role_id, _users.since, roles.title as role, roles.perm from _users
    inner join roles on _users.role_id = roles.role_id;

create table uploads (
    upload_id serial primary key,
    origin_file varchar(255) not null,
    stored_name text not null,
    downloaded integer not null default 0,
    since timestamp default current_timestamp
);

create table _tasks (
    task_id serial primary key,
    title text unique not null,
    description text,
    upload_id integer REFERENCES uploads(upload_id) ON DELETE CASCADE,
    accepted integer not null default 0,
    submitted integer not null default 0,
    approved integer not null default 0,
    since timestamp not null default current_timestamp,
    during tsrange
);

create or replace view tasks AS
    select  _tasks.task_id as task_id, title, description, _tasks.since, origin_file, stored_name, accepted, submitted, approved, downloaded,
        lower(during) as "start", upper(during) as "end", during, CASE WHEN (_tasks.during @> current_timestamp::timestamp ) THEN 1 ELSE 0 END as active
        from _tasks left outer join uploads on _tasks.upload_id = uploads.upload_id;


create table _assignments (
    assignment_id serial primary key,
    task_id integer not null references _tasks(task_id) ON DELETE CASCADE,
    user_id integer not null references _users(id) ON DELETE CASCADE,
    upload_id integer references uploads(upload_id) ON DELETE CASCADE,
    since timestamp default current_timestamp,
    accepted boolean not null default 't',
    submitted boolean not null default 'f',
    approved boolean not null default 'f',
    unique (task_id, user_id)
);

create view assignments as
    select _assignments.assignment_id, _assignments.task_id, _assignments.user_id, _assignments.accepted, _assignments.submitted, _assignments.approved, _assignments.since,
        uploads.upload_id, uploads.origin_file, uploads.stored_name, uploads.downloaded, uploads.since as submitted_time
    from _assignments
    left outer join uploads on _assignments.upload_id = uploads.upload_id;

create view user_brief as
    select user_id
    , SUM(CASE WHEN accepted THEN 1 ELSE 0 END) as uac
    , SUM(CASE WHEN submitted THEN 1 ELSE 0 END) as usu
    , SUM(CASE WHEN approved THEN 1 ELSE 0 END) as uap
    , SUM(CASE WHEN accepted THEN 0 ELSE 1 END) as uab
     from _assignments group by user_id;

create or replace view user_state as
    select _users.id, _users.student_id, _users.realname, _users.nickname, assignments.assignment_id, assignments.task_id, assignments.accepted as uac, assignments.submitted as usu, assignments.approved as uap
     , assignments.origin_file as uof, assignments.stored_name as usn, assignments.downloaded as udt, assignments.since as usi
     from assignments right outer join _users on assignments.user_id = _users.id;

create or replace view user_assignments as
    select tasks.*, assignments.user_id, assignments.accepted as uac, assignments.submitted as usu, assignments.approved as uap,
     assignments.origin_file as uof, assignments.stored_name as usn, assignments.downloaded as udt, assignments.since as usi from assignments
    inner join tasks on tasks.task_id =  assignments.task_id;


create table comments (
    msg_id serial primary key,
    task_id integer references _tasks(task_id) ON DELETE CASCADE,
    user_id integer not null references _users(id) ON DELETE CASCADE,
    nickname varchar(30) not null,
    message text not null,
    since timestamp default current_timestamp
);

create table feed_types (
    type_id serial primary key,
    title text not null,
    has_file boolean not null default 'f'::boolean
);

insert into feed_types(title, has_file) values ('Published', 't'), ('Accepted', 'f'), ('Submitted','t'), ('Finished', 't'), ('Reset', 'f'), ('Aborted', 'f');

create table _feeds (
    feed_id serial primary key,
    user_id integer not null references _users(id) ON DELETE CASCADE,
    type_id integer not null references feed_types(type_id) ON DELETE CASCADE,
    task_id integer not null references _tasks(task_id) ON DELETE CASCADE,
    upload_id integer references uploads(upload_id) ON DELETE CASCADE,
    starred integer not null default 0,
    since timestamp not null default current_timestamp
);

create view feeds as
    select users.student_id, users.nickname, users.realname, users.perm,
     feed_types.title as type, feed_types.has_file, tasks.task_id, tasks.title, tasks.origin_file,
     tasks.stored_name, uploads.origin_file as uof, uploads.stored_name as usn,
     _feeds.since, _feeds.starred, _feeds.feed_id
     from _feeds
        inner join users on users.uid = _feeds.user_id
        inner join feed_types on feed_types.type_id = _feeds.type_id
        inner join tasks on tasks.task_id = _feeds.task_id
        left outer join uploads on uploads.upload_id = _feeds.upload_id;


create table feed_stars (
    user_id integer not null references _users(id) ON DELETE CASCADE,
    feed_id integer not null references _feeds(feed_id) ON DELETE CASCADE,
    primary key (user_id, feed_id)
);

commit;
