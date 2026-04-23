"use client"

import dynamic from "next/dynamic"

const OrganizationList = dynamic(
  () => import("@clerk/nextjs").then(mod => mod.OrganizationList),
  { ssr: false }
)

export function OrganizationSelectClient({
  redirectUrl,
}: {
  redirectUrl: string
}) {
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
