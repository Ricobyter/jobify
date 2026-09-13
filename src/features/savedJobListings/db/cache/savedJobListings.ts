import {
  getGlobalTag,
  getIdTag,
  getJobListingTag,
  getUserTag,
} from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getSavedJobListingGlobalTag() {
  return getGlobalTag("savedJobListings")
}

export function getSavedJobListingJobListingTag(jobListingId: string) {
  return getJobListingTag("savedJobListings", jobListingId)
}

export function getSavedJobListingUserTag(userId: string) {
  return getUserTag("savedJobListings", userId)
}

export function getSavedJobListingIdTag({
  jobListingId,
  userId,
}: {
  jobListingId: string
  userId: string
}) {
  return getIdTag("savedJobListings", `${jobListingId}-${userId}`)
}

export function revalidateSavedJobListingCache(id: {
  userId: string
  jobListingId: string
}) {
  revalidateTag(getSavedJobListingGlobalTag())
  revalidateTag(getSavedJobListingJobListingTag(id.jobListingId))
  revalidateTag(getSavedJobListingUserTag(id.userId))
  revalidateTag(getSavedJobListingIdTag(id))
}
