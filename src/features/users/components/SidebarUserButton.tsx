import { Suspense } from "react"
import { SidebarUserButtonClient } from "./_SidebarUserButtonClient"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { SignOutButton } from "@/services/clerk/components/AuthButtons"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { LogOutIcon } from "lucide-react"
import { ensureCurrentUserInDb } from "@/services/clerk/lib/syncAuthToDb"

export function SidebarUserButton() {
  return (
    <Suspense>
      <SidebarUserSuspense />
    </Suspense>
  )
}

async function SidebarUserSuspense() {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null) return null

  if (user == null) {
    await ensureCurrentUserInDb(userId)
    const { user: syncedUser } = await getCurrentUser({ allData: true })
    if (syncedUser != null) return <SidebarUserButtonClient user={syncedUser} />
  }

  if (user == null) {
    return (
      <SignOutButton>
        <SidebarMenuButton>
          <LogOutIcon />
          <span>Log Out</span>
        </SidebarMenuButton>
      </SignOutButton>
    )
  }

  return <SidebarUserButtonClient user={user} />
}
