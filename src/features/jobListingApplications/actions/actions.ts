"use server"

import { db } from "@/drizzle/db"
import {
  ApplicationStage,
  applicationStages,
  JobListingTable,
} from "@/drizzle/schema"
import { getJobListingIdTag } from "@/features/jobListings/db/cache/jobListings"
import { getUserResumeIdTag } from "@/features/users/db/cache/userResumes"
import {
  getCurrentOrganization,
  getCurrentUser,
} from "@/services/clerk/lib/getCurrentAuth"
import { and, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { z } from "zod"
import { newJobListingApplicationSchema } from "./schemas"
import {
  insertJobListingApplication,
  updateJobListingApplication,
} from "../db/jobListingsApplications"
import { inngest } from "@/services/inngest/client"
import { hasOrgUserPermission } from "@/services/clerk/lib/orgUserPermissions"
import { getUserResumeById } from "@/features/users/db/userResumes"
import { OrganizationUserSettingsTable } from "@/drizzle/schema"

export async function createJobListingApplication(
  jobListingId: string,
  unsafeData: z.infer<typeof newJobListingApplicationSchema>
) {
  const permissionError = {
    error: true,
    message: "You don't have permission to submit an application",
  }
  const { userId } = await getCurrentUser()
  if (userId == null) return permissionError

  const [userResume, jobListing] = await Promise.all([
    getUserResume(userId, unsafeData.resumeId),
    getPublicJobListingWithOrg(jobListingId),
  ])
  if (userResume == null || jobListing == null) return permissionError

  // Block members of the org that owns this listing from applying
  const isMember = await isOrgMember(userId, jobListing.organizationId)
  if (isMember) return permissionError

  const { success, data } = newJobListingApplicationSchema.safeParse(unsafeData)

  if (!success) {
    return {
      error: true,
      message: "There was an error submitting your application",
    }
  }

  await insertJobListingApplication({
    jobListingId,
    userId,
    ...data,
  })

  await inngest.send({
    name: "app/jobListingApplication.created",
    data: { jobListingId, userId },
  })

  return {
    error: false,
    message: "Your application was successfully submitted",
  }
}

export async function updateJobListingApplicationStage(
  {
    jobListingId,
    userId,
  }: {
    jobListingId: string
    userId: string
  },
  unsafeStage: ApplicationStage
) {
  const { success, data: stage } = z
    .enum(applicationStages)
    .safeParse(unsafeStage)

  if (!success) {
    return {
      error: true,
      message: "Invalid stage",
    }
  }

  if (
    !(await hasOrgUserPermission("org:job_listing_applications:change_stage"))
  ) {
    return {
      error: true,
      message: "You don't have permission to update the stage",
    }
  }

  const { orgId } = await getCurrentOrganization()
  const jobListing = await getJobListing(jobListingId)
  if (
    orgId == null ||
    jobListing == null ||
    orgId !== jobListing.organizationId
  ) {
    return {
      error: true,
      message: "You don't have permission to update the stage",
    }
  }

  await updateJobListingApplication(
    {
      jobListingId,
      userId,
    },
    { stage }
  )

  if (stage === "interested") {
    await inngest.send({
      name: "app/jobListingApplication.markedInterested",
      data: { jobListingId, applicantUserId: userId },
    })
  }
}

export async function updateJobListingApplicationRating(
  {
    jobListingId,
    userId,
  }: {
    jobListingId: string
    userId: string
  },
  unsafeRating: number | null
) {
  const { success, data: rating } = z
    .number()
    .min(1)
    .max(5)
    .nullish()
    .safeParse(unsafeRating)

  if (!success) {
    return {
      error: true,
      message: "Invalid rating",
    }
  }

  if (
    !(await hasOrgUserPermission("org:job_listing_applications:change_rating"))
  ) {
    return {
      error: true,
      message: "You don't have permission to update the rating",
    }
  }

  const { orgId } = await getCurrentOrganization()
  const jobListing = await getJobListing(jobListingId)
  if (
    orgId == null ||
    jobListing == null ||
    orgId !== jobListing.organizationId
  ) {
    return {
      error: true,
      message: "You don't have permission to update the rating",
    }
  }

  await updateJobListingApplication(
    {
      jobListingId,
      userId,
    },
    { rating }
  )
}

async function getPublicJobListingWithOrg(id: string) {
  "use cache"
  cacheTag(getJobListingIdTag(id))

  return db.query.JobListingTable.findFirst({
    where: and(
      eq(JobListingTable.id, id),
      eq(JobListingTable.status, "published")
    ),
    columns: { id: true, organizationId: true },
  })
}

async function isOrgMember(userId: string, organizationId: string) {
  const [row] = await db
    .select({ userId: OrganizationUserSettingsTable.userId })
    .from(OrganizationUserSettingsTable)
    .where(
      and(
        eq(OrganizationUserSettingsTable.userId, userId),
        eq(OrganizationUserSettingsTable.organizationId, organizationId)
      )
    )
  return row != null
}

async function getJobListing(id: string) {
  "use cache"
  cacheTag(getJobListingIdTag(id))

  return db.query.JobListingTable.findFirst({
    where: eq(JobListingTable.id, id),
    columns: { organizationId: true },
  })
}

async function getUserResume(userId: string, resumeId: string) {
  "use cache"
  cacheTag(getUserResumeIdTag(userId))

  return getUserResumeById(userId, resumeId)
}
