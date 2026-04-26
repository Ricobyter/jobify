import { connection } from "next/server"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { Suspense } from "react"

export function UploadThingSSR() {
  return (
    <Suspense>
      <UTSSR />
    </Suspense>
  )
}

async function UTSSR() {
  if (process.env.UPLOADTHING_TOKEN == null) return null

  await connection()

  try {
    const { customFileRouter } = await import("../router")
    return <NextSSRPlugin routerConfig={extractRouterConfig(customFileRouter)} />
  } catch (error) {
    console.error("[UploadThingSSR] Failed to load UploadThing router", error)
    return null
  }
}
