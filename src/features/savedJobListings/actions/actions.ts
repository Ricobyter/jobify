"use server"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import {
  deleteSavedJobListing,
  getSavedJobListingIds,
  insertSavedJobListing,
} from "../db/savedJobListings"

export async function toggleSavedJobListing(jobListingId: string) {
  const permissionError = {
    error: true,
    message: "You must be signed in to save jobs",
  }
  const { userId } = await getCurrentUser()
  if (userId == null) return permissionError

  const savedJobListingIds = await getSavedJobListingIds(userId)

  if (savedJobListingIds.has(jobListingId)) {
    await deleteSavedJobListing({ jobListingId, userId })
    return { error: false, message: "Removed from saved jobs", saved: false }
  }

  await insertSavedJobListing({ jobListingId, userId })
  return { error: false, message: "Saved", saved: true }
}
