"use server"

import { revalidateUserResumeCache } from "@/features/users/db/cache/userResumes"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"

export async function revalidateResumeCache() {
  const { userId } = await getCurrentUser()
  if (userId == null) return
  revalidateUserResumeCache(userId)
}
