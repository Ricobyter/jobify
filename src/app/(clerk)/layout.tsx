import { connection } from "next/server"

export default async function ClerkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div>{children}</div>
    </div>
  )
}
