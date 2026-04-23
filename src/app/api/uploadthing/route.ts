import { customFileRouter } from "@/services/uploadthing/router"
import { createRouteHandler } from "uploadthing/next"

export const maxDuration = 60

export const { GET, POST } = createRouteHandler({
  router: customFileRouter,
  config: { token: process.env.UPLOADTHING_TOKEN },
})
