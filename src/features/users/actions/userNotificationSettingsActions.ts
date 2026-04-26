"use server"

import { z } from "zod"
import { userNotificationSettingsSchema } from "./schemas"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { updateUserNotificationSettings as updateUserNotificationSettingsDb } from "@/features/users/db/userNotificationSettings"
import { ensureCurrentUserInDb } from "@/services/clerk/lib/syncAuthToDb"

export async function updateUserNotificationSettings(
  unsafeData: z.infer<typeof userNotificationSettingsSchema>
) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You must be signed in to update notification settings",
    }
  }

  await ensureCurrentUserInDb(userId)

  const { success, data } = userNotificationSettingsSchema.safeParse(unsafeData)
  if (!success) {
    return {
      error: true,
      message: "There was an error updating your notification settings",
    }
  }

  await updateUserNotificationSettingsDb(userId, data)

  return {
    error: false,
    message: "Successfully updated your notification settings",
  }
}
