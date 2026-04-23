import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { insertUser } from "@/features/users/db/users"
import { insertUserNotificationSettings } from "@/features/users/db/userNotificationSettings"

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 })
  }

  const { userId } = await auth()
  if (userId == null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  const email = user.emailAddresses.find(
    e => e.id === user.primaryEmailAddressId
  )
  if (email == null) {
    return NextResponse.json({ error: "No primary email" }, { status: 400 })
  }

  await insertUser({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    imageUrl: user.imageUrl,
    email: email.emailAddress,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  })

  await insertUserNotificationSettings({ userId: user.id })

  return NextResponse.json({ success: true, userId: user.id })
}
