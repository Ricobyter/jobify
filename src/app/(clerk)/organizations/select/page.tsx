import { Suspense } from "react"
import { OrganizationSelectClient } from "./_OrganizationSelectClient"

type Props = {
  searchParams: Promise<{ redirect?: string }>
}

async function OrganizationSelectContent({ searchParams }: Props) {
  const { redirect } = await searchParams
  return <OrganizationSelectClient redirectUrl={redirect ?? "/employer"} />
}

export default function OrganizationSelectPage(props: Props) {
  return (
    <Suspense>
      <OrganizationSelectContent {...props} />
    </Suspense>
  )
}
