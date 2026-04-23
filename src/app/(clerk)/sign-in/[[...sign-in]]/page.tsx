import { SignIn } from "@clerk/nextjs"
import { connection } from "next/server"
import { Suspense } from "react"

export default async function SignInPage() {
  await connection()

  return (
    <Suspense>
      <SignIn />
    </Suspense>
  )
}
