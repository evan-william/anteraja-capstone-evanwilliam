-- Daftar primary key dan foreign key dalam bentuk definisi PostgreSQL asli.
select
  con.conrelid::regclass as table_name,
  con.conname as constraint_name,
  case con.contype when 'p' then 'PRIMARY KEY' when 'f' then 'FOREIGN KEY' end as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_namespace n on n.oid = con.connamespace
where n.nspname = 'public'
  and con.contype in ('p', 'f')
order by con.conrelid::regclass::text, constraint_type desc, con.conname;
