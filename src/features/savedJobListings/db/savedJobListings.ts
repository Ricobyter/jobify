import { db } from "@/drizzle/db"
import { SavedJobListingTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import {
  getSavedJobListingUserTag,
  revalidateSavedJobListingCache,
} from "./cache/savedJobListings"

export async function insertSavedJobListing(
  savedJobListing: typeof SavedJobListingTable.$inferInsert
) {
  await db.insert(SavedJobListingTable).values(savedJobListing)
  revalidateSavedJobListingCache(savedJobListing)
}

export async function deleteSavedJobListing({
  jobListingId,
  userId,
}: {
  jobListingId: string
  userId: string
}) {
  await db
    .delete(SavedJobListingTable)
    .where(
      and(
        eq(SavedJobListingTable.jobListingId, jobListingId),
        eq(SavedJobListingTable.userId, userId)
      )
    )
  revalidateSavedJobListingCache({ jobListingId, userId })
}

export async function getSavedJobListingIds(userId: string) {
  "use cache"
  cacheTag(getSavedJobListingUserTag(userId))

  const rows = await db.query.SavedJobListingTable.findMany({
    where: eq(SavedJobListingTable.userId, userId),
    columns: { jobListingId: true },
  })

  return new Set(rows.map(row => row.jobListingId))
}
