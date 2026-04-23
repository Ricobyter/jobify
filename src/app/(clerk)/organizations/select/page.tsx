import { connection } from "next/server"
import { OrganizationSelectClient } from "./_OrganizationSelectClient"

type Props = {
  searchParams: Promise<{ redirect?: string }>
}

export default async function OrganizationSelectPage({ searchParams }: Props) {
  await connection()
  const { redirect } = await searchParams
  const redirectUrl = redirect ?? "/employer"

  return <OrganizationSelectClient redirectUrl={redirectUrl} />
}
