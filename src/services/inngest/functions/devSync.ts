import { clerkClient } from "@clerk/nextjs/server"
import { inngest } from "../client"
import { insertUser } from "@/features/users/db/users"
import { insertUserNotificationSettings } from "@/features/users/db/userNotificationSettings"

export const devSyncUser = inngest.createFunction(
  { id: "dev/sync-user-from-clerk", name: "Dev - Sync User from Clerk" },
  { event: "dev/sync.user" },
  async ({ event, step }) => {
    const { userId } = event.data

    const user = await step.run("fetch-clerk-user", async () => {
      const client = await clerkClient()
      return client.users.getUser(userId)
    })

    await step.run("insert-user", async () => {
      const email = user.emailAddresses.find(
        e => e.id === user.primaryEmailAddressId
      )
      if (email == null) throw new Error("No primary email found")

      await insertUser({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        imageUrl: user.imageUrl,
        email: email.emailAddress,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      })
    })

    await step.run("insert-notification-settings", async () => {
      await insertUserNotificationSettings({ userId })
    })

    return { synced: userId }
  }
)
