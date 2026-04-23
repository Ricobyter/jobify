import { Suspense } from "react"
import { OrganizationSelectClient } from "./_OrganizationSelectClient"

export default function OrganizationSelectPage() {
  return (
    <Suspense>
      <OrganizationSelectClient />
    </Suspense>
  )
}
