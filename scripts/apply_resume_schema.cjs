const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME.split('?')[0],
  ssl: { rejectUnauthorized: false },
})

async function columnExists(client, tableName, columnName) {
  const result = await client.query(
    "select 1 from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = $2 limit 1",
    [tableName, columnName]
  )
  return result.rowCount > 0
}

async function constraintExists(client, constraintName) {
  const result = await client.query(
    'select 1 from pg_constraint where conname = $1 limit 1',
    [constraintName]
  )
  return result.rowCount > 0
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('create schema if not exists drizzle')
    await client.query('create extension if not exists "pgcrypto"')
    await client.query(`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )
    `)

    if ((await columnExists(client, 'user_resumes', 'id')) === false) {
      await client.query('alter table "user_resumes" add column "id" uuid')
      await client.query('alter table "user_resumes" add column "title" varchar')
      await client.query('update "user_resumes" set "id" = gen_random_uuid() where "id" is null')
      await client.query(
        "update \"user_resumes\" set \"title\" = 'Resume' where \"title\" is null or btrim(\"title\") = ''"
      )
      await client.query('alter table "user_resumes" alter column "id" set default gen_random_uuid()')
      await client.query('alter table "user_resumes" alter column "id" set not null')
      await client.query('alter table "user_resumes" alter column "title" set not null')
      await client.query('alter table "user_resumes" drop constraint if exists "user_resumes_pkey"')
      await client.query('alter table "user_resumes" add constraint "user_resumes_pkey" primary key ("id")')
    }

    if ((await columnExists(client, 'job_listing_applications', 'resumeId')) === false) {
      await client.query('alter table "job_listing_applications" add column "resumeId" uuid')
      await client.query(
        'update "job_listing_applications" as jla set "resumeId" = ur."id" from "user_resumes" as ur where ur."userId" = jla."userId"'
      )
      await client.query('alter table "job_listing_applications" alter column "resumeId" set not null')
      await client.query(
        'alter table "job_listing_applications" add constraint "job_listing_applications_resumeId_user_resumes_id_fk" foreign key ("resumeId") references "public"."user_resumes"("id") on delete no action on update no action'
      )
    }

    const applied = await client.query('select hash from drizzle.__drizzle_migrations')
    const appliedHashes = new Set(applied.rows.map(row => row.hash))
    const migrations = [
      { hash: '0000_moaning_human_robot', created_at: 1749129359810 },
      { hash: '0001_multiple_user_resumes', created_at: 1777334400000 },
      { hash: '0002_fair_warpath', created_at: 1777333857825 },
    ]

    for (const migration of migrations) {
      if (appliedHashes.has(migration.hash) === false) {
        await client.query('insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)', [
          migration.hash,
          migration.created_at,
        ])
      }
    }

    if (
      (await constraintExists(client, 'job_listing_applications_resumeId_user_resumes_id_fk')) === false &&
      (await columnExists(client, 'job_listing_applications', 'resumeId'))
    ) {
      await client.query(
        'alter table "job_listing_applications" add constraint "job_listing_applications_resumeId_user_resumes_id_fk" foreign key ("resumeId") references "public"."user_resumes"("id") on delete no action on update no action'
      )
    }

    console.log('Resume schema migration applied successfully.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
