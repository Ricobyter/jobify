"use client"

import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

const OrganizationList = dynamic(
  () => import("@clerk/nextjs").then(mod => mod.OrganizationList),
  { ssr: false }
)

export function OrganizationSelectClient() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") ?? "/employer"

  return (
    <OrganizationList
      hidePersonal
      hideSlug
      skipInvitationScreen
      afterSelectOrganizationUrl={redirectUrl}
      afterCreateOrganizationUrl={redirectUrl}
    />
  )
}
