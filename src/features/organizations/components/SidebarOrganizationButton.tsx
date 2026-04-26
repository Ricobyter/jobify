import { Suspense } from "react"
import {
  getCurrentOrganization,
  getCurrentUser,
} from "@/services/clerk/lib/getCurrentAuth"
import { SignOutButton } from "@/services/clerk/components/AuthButtons"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { LogOutIcon } from "lucide-react"
import { SidebarOrganizationButtonClient } from "./_SidebarOrganizationButtonClient"
import {
  ensureCurrentOrganizationInDb,
  ensureCurrentUserInDb,
} from "@/services/clerk/lib/syncAuthToDb"

export function SidebarOrganizationButton() {
  return (
    <Suspense>
      <SidebarOrganizationSuspense />
    </Suspense>
  )
}

async function SidebarOrganizationSuspense() {
  const [{ userId, user }, { orgId, organization }] = await Promise.all([
    getCurrentUser({ allData: true }),
    getCurrentOrganization({ allData: true }),
  ])

  if (userId == null || orgId == null) return null

  if (user == null || organization == null) {
    await Promise.all([
      ensureCurrentUserInDb(userId),
      ensureCurrentOrganizationInDb(orgId),
    ])

    const [{ user: syncedUser }, { organization: syncedOrganization }] =
      await Promise.all([
        getCurrentUser({ allData: true }),
        getCurrentOrganization({ allData: true }),
      ])

    if (syncedUser != null && syncedOrganization != null) {
      return (
        <SidebarOrganizationButtonClient
          user={syncedUser}
          organization={syncedOrganization}
        />
      )
    }
  }

  if (user == null || organization == null) {
    return (
      <SignOutButton>
        <SidebarMenuButton>
          <LogOutIcon />
          <span>Log Out</span>
        </SidebarMenuButton>
      </SignOutButton>
    )
  }

  return (
    <SidebarOrganizationButtonClient user={user} organization={organization} />
  )
}
