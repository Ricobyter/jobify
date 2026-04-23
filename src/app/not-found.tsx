import { connection } from "next/server"
import Link from "next/link"

export default async function NotFound() {
  await connection()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground text-lg">Page not found</p>
      <Link href="/" className="underline underline-offset-4">
        Go home
      </Link>
    </div>
  )
}
