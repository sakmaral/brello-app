install:
	pnpm install

start:
	pnpm dev

db.init:
	pnpm supabase init

db.login:
	pnpm supabase login

db.link:
	pnpm supabase link --project-ref $(project)

db.start:
	pnpm supabase start

db.start.db-only:
	pnpm supabase db start

db.stop:
	pnpm supabase stop

db.status:
	pnpm supabase status

db.migrations.new:
	pnpm supabase migration new $(name)

db.migrations.apply:
	pnpm supabase migration up --local

db.migrations.pull:
	pnpm supabase db pull

db.migrations.push:
	pnpm supabase db push

db.migrations.diff.local:
	pnpm supabase db diff -f $(name) --local

db.types.generate:
	pnpm supabase gen types typescript --local > ./src/shared/api/database.types.ts
	pnpm prettier --write ./src/shared/api/database.types.ts