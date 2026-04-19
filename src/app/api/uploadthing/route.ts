import { customFileRouter } from "@/services/uploadthing/router"
import { createRouteHandler } from "uploadthing/next"

export const { GET, POST } = createRouteHandler({
  router: customFileRouter,
  config: { token: process.env.UPLOADTHING_TOKEN },
})
