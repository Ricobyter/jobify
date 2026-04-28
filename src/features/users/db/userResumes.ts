import { db } from "@/drizzle/db"
import { UserResumeTable } from "@/drizzle/schema"
import {
  getUserResumeIdTag,
  revalidateUserResumeCache,
} from "./cache/userResumes"
import { and, desc, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

export async function upsertUserResume(
  userId: string,
  data: Omit<typeof UserResumeTable.$inferInsert, "userId" | "id">
) {
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

export async function updateUserResume(
  resumeId: string,
  data: Partial<Omit<typeof UserResumeTable.$inferInsert, "userId" | "id">>
) {
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
}

export async function getUserResumes(userId: string) {
  "use cache"
  cacheTag(getUserResumeIdTag(userId))

  return db.query.UserResumeTable.findMany({
    where: eq(UserResumeTable.userId, userId),
    orderBy: [desc(UserResumeTable.createdAt)],
  })
}

export async function getUserResumeById(userId: string, resumeId: string) {
  "use cache"
  cacheTag(getUserResumeIdTag(userId))

  return db.query.UserResumeTable.findFirst({
    where: and(
      eq(UserResumeTable.userId, userId),
      eq(UserResumeTable.id, resumeId)
    ),
  })
}
