"use client"

import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const OrganizationList = dynamic(
  () => import("@clerk/nextjs").then(mod => mod.OrganizationList),
  { ssr: false }
)

function OrganizationSelectContent() {
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

export default function OrganizationSelectPage() {
  return (
    <Suspense>
      <OrganizationSelectContent />
    </Suspense>
  )
}
