import { db } from "@/drizzle/db"
import { OrganizationTable, UserTable } from "@/drizzle/schema"
import { insertOrganizationUserSettings } from "@/features/organizations/db/organizationUserSettings"
import { insertOrganization } from "@/features/organizations/db/organizations"
import { insertUserNotificationSettings } from "@/features/users/db/userNotificationSettings"
import { insertUser } from "@/features/users/db/users"
import { clerkClient } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"

export async function ensureCurrentUserInDb(userId: string) {
  const existingUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, userId),
    columns: { id: true },
  })
  if (existingUser != null) return

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses.find(
    e => e.id === user.primaryEmailAddressId
  )

  if (email == null) {
    throw new Error("No primary email found for current user")
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()

  await insertUser({
    id: user.id,
    name: name || user.username || email.emailAddress,
    imageUrl: user.imageUrl,
    email: email.emailAddress,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  })

  await insertUserNotificationSettings({ userId: user.id })
}

export async function ensureCurrentOrganizationInDb(organizationId: string) {
  const existingOrganization = await db.query.OrganizationTable.findFirst({
    where: eq(OrganizationTable.id, organizationId),
    columns: { id: true },
  })
  if (existingOrganization != null) return

  const client = await clerkClient()
  const organization = await client.organizations.getOrganization({
    organizationId,
  })

  await insertOrganization({
    id: organization.id,
    name: organization.name,
    imageUrl: organization.imageUrl,
    createdAt: new Date(organization.createdAt),
    updatedAt: new Date(organization.updatedAt),
  })
}

export async function ensureOrganizationUserSettingsInDb({
  userId,
  organizationId,
}: {
  userId: string
  organizationId: string
}) {
  await Promise.all([
    ensureCurrentUserInDb(userId),
    ensureCurrentOrganizationInDb(organizationId),
  ])

  await insertOrganizationUserSettings({ userId, organizationId })
}