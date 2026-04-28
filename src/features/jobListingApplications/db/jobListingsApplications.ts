import { db } from "@/drizzle/db"
import { JobListingApplicationTable } from "@/drizzle/schema"
import { revalidateJobListingApplicationCache } from "./cache/jobListingApplications"
import { and, eq, sql } from "drizzle-orm"
import { getResumeSchemaShape } from "@/features/users/db/userResumes"

export async function insertJobListingApplication(
  application: typeof JobListingApplicationTable.$inferInsert
) {
  const schemaShape = await getResumeSchemaShape()

  if (schemaShape.hasIdColumn && schemaShape.hasTitleColumn) {
    await db.insert(JobListingApplicationTable).values(application)
  } else {
    const stage = (application as { stage?: string }).stage ?? "applied"
    await db.execute(sql`
      insert into "job_listing_applications" (
        "jobListingId",
        "userId",
        "coverLetter",
        "rating",
        "stage"
      ) values (
        ${application.jobListingId},
        ${application.userId},
        ${application.coverLetter ?? null},
        ${application.rating ?? null},
        ${stage}
      )
    `)
  }

  revalidateJobListingApplicationCache(application)
}

export async function updateJobListingApplication(
  {
    jobListingId,
    userId,
  }: {
    jobListingId: string
    userId: string
  },
  data: Partial<typeof JobListingApplicationTable.$inferInsert>
) {
  await db
    .update(JobListingApplicationTable)
    .set(data)
    .where(
      and(
        eq(JobListingApplicationTable.jobListingId, jobListingId),
        eq(JobListingApplicationTable.userId, userId)
      )
    )

  revalidateJobListingApplicationCache({ jobListingId, userId })
}
