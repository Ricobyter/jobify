import { db } from "@/drizzle/db"
import { UserResumeTable } from "@/drizzle/schema"
import {
  getUserResumeIdTag,
  revalidateUserResumeCache,
} from "./cache/userResumes"
import { and, desc, eq, sql } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

type ResumeSchemaShape = {
  hasIdColumn: boolean
  hasTitleColumn: boolean
}

export async function getResumeSchemaShape(): Promise<ResumeSchemaShape> {
  const result = await db.execute(sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_resumes'
      and column_name in ('id', 'title')
  `)

  const rows = ((result as unknown) as { rows?: Array<{ column_name: string }> }).rows ?? []
  const columns = new Set(rows.map(row => row.column_name))

  return {
    hasIdColumn: columns.has('id'),
    hasTitleColumn: columns.has('title'),
  }
}

export async function upsertUserResume(
  userId: string,
  data: Omit<typeof UserResumeTable.$inferInsert, "userId" | "id">
) {
  const schemaShape = await getResumeSchemaShape()

  if (schemaShape.hasIdColumn && schemaShape.hasTitleColumn) {
    const [resume] = await db
      .insert(UserResumeTable)
      .values({ userId, ...data })
      .returning({ id: UserResumeTable.id })

    try {
      revalidateUserResumeCache(userId)
    } catch (err) {
      console.error("[upsertUserResume] revalidateTag failed:", err)
    }

    return resume
  }

  const result = await db.execute(sql`
    insert into "user_resumes" ("userId", "resumeFileUrl", "resumeFileKey", "aiSummary")
    values (${userId}, ${data.resumeFileUrl}, ${data.resumeFileKey}, ${data.aiSummary ?? null})
    on conflict ("userId") do update set
      "resumeFileUrl" = excluded."resumeFileUrl",
      "resumeFileKey" = excluded."resumeFileKey",
      "aiSummary" = excluded."aiSummary"
    returning "userId" as id
  `)

  const [resume] = ((result as unknown) as { rows?: Array<{ id: string }> }).rows ?? []

  try {
    revalidateUserResumeCache(userId)
  } catch (err) {
    console.error("[upsertUserResume] revalidateTag failed:", err)
  }

  return resume as { id: string }
}

export async function updateUserResume(
  resumeId: string,
  data: Partial<Omit<typeof UserResumeTable.$inferInsert, "userId" | "id">>
) {
  const schemaShape = await getResumeSchemaShape()

  if (schemaShape.hasIdColumn && schemaShape.hasTitleColumn) {
    const existingResume = await db.query.UserResumeTable.findFirst({
      where: eq(UserResumeTable.id, resumeId),
      columns: { userId: true },
    })

    await db
      .update(UserResumeTable)
      .set(data)
      .where(eq(UserResumeTable.id, resumeId))

    if (existingResume) {
      revalidateUserResumeCache(existingResume.userId)
    }

    return
  }

  await db.execute(sql`
    update "user_resumes"
    set
      "resumeFileUrl" = coalesce(${data.resumeFileUrl}, "resumeFileUrl"),
      "resumeFileKey" = coalesce(${data.resumeFileKey}, "resumeFileKey"),
      "aiSummary" = coalesce(${data.aiSummary}, "aiSummary")
    where "userId" = ${resumeId}
  `)

  revalidateUserResumeCache(resumeId)
}

export async function getUserResumes(userId: string) {
  "use cache"
  cacheTag(getUserResumeIdTag(userId))

  const schemaShape = await getResumeSchemaShape()

  if (schemaShape.hasIdColumn && schemaShape.hasTitleColumn) {
    return db.query.UserResumeTable.findMany({
      where: eq(UserResumeTable.userId, userId),
      orderBy: [desc(UserResumeTable.createdAt)],
    })
  }

  const result = await db.execute(sql`
    select
      "userId" as id,
      'Resume' as title,
      "resumeFileUrl",
      "resumeFileKey",
      "aiSummary",
      "createdAt",
      "updatedAt"
    from "user_resumes"
    where "userId" = ${userId}
    order by "createdAt" desc
  `)

  return ((result as { rows?: unknown[] }).rows ?? result) as typeof UserResumeTable.$inferSelect[]
}

export async function getUserResumeById(userId: string, resumeId: string) {
  "use cache"
  cacheTag(getUserResumeIdTag(userId))

  const schemaShape = await getResumeSchemaShape()

  if (schemaShape.hasIdColumn && schemaShape.hasTitleColumn) {
    return db.query.UserResumeTable.findFirst({
      where: and(
        eq(UserResumeTable.userId, userId),
        eq(UserResumeTable.id, resumeId)
      ),
    })
  }

  const result = await db.execute(sql`
    select
      "userId" as id,
      'Resume' as title,
      "resumeFileUrl",
      "resumeFileKey",
      "aiSummary",
      "createdAt",
      "updatedAt"
    from "user_resumes"
    where "userId" = ${resumeId}
    limit 1
  `)

  const rows = (((result as unknown) as { rows?: typeof UserResumeTable.$inferSelect[] }).rows ?? []) as typeof UserResumeTable.$inferSelect[]
  return rows[0] ?? null
}
