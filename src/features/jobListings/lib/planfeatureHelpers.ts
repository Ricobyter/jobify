import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"
import { getJobListingOrganizationTag } from "../db/cache/jobListings"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { db } from "@/drizzle/db"
import { JobListingTable } from "@/drizzle/schema"
import { and, count, eq } from "drizzle-orm"
import { hasPlanFeature } from "@/services/clerk/lib/planFeatures"

export async function hasReachedMaxPublishedJobListings() {
  return false
}

export async function canPublishJobListings() {
  return true
}

export async function hasReachedMaxFeaturedJobListings() {
  const { orgId } = await getCurrentOrganization()
  if (orgId == null) return true

  const count = await getFeaturedJobListingsCount(orgId)

  const canFeature = await Promise.all([
    hasPlanFeature("1_featured_job_listing").then(has => has && count < 1),
    hasPlanFeature("unlimited_featured_jobs_listings"),
  ])

  return !canFeature.some(Boolean)
}

async function getFeaturedJobListingsCount(orgId: string) {
  "use cache"
  cacheTag(getJobListingOrganizationTag(orgId))

  const [res] = await db
    .select({ count: count() })
    .from(JobListingTable)
    .where(
      and(
        eq(JobListingTable.organizationId, orgId),
        eq(JobListingTable.isFeatured, true)
      )
    )
  return res?.count ?? 0
}
