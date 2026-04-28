import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { getCurrentUser } from "../clerk/lib/getCurrentAuth"
import { inngest } from "../inngest/client"
import { upsertUserResume } from "@/features/users/db/userResumes"
import { ensureCurrentUserInDb } from "../clerk/lib/syncAuthToDb"
import { z } from "zod"

const f = createUploadthing()

export const customFileRouter = {
  resumeUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .input(z.object({ title: z.string().trim().min(1) }))
    .middleware(async ({ input }) => {
      const { userId } = await getCurrentUser()
      if (userId == null) throw new UploadThingError("Unauthorized")

      try {
        await ensureCurrentUserInDb(userId)
      } catch (err) {
        console.error("[UT] Failed to sync current user into DB:", err)
        throw new UploadThingError("Unable to prepare user profile for upload")
      }

      return { userId, title: input.title.trim() }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] onUploadComplete START", {
        userId: metadata.userId,
        title: metadata.title,
        fileKey: file.key,
        ufsUrl: file.ufsUrl,
      })
      const { userId, title } = metadata

      try {
        const resume = await upsertUserResume(userId, {
          title,
          resumeFileUrl: file.ufsUrl,
          resumeFileKey: file.key,
        })
        console.log("[UT] upsertUserResume done, resume:", { id: resume?.id, userId: resume?.id })

        if (resume?.id == null) {
          throw new Error("Failed to create resume record")
        }

        console.log("[UT] Sending Inngest event with:", { userId, resumeId: resume.id })
        inngest
          .send({
            name: "app/resume.uploaded",
            data: { userId, resumeId: resume.id },
          })
          .then(() => console.log("[UT] Inngest event sent successfully"))
          .catch(err => console.error("[UT] Failed to send inngest event:", err))
      } catch (err) {
        console.error("[UT] upsertUserResume FAILED:", err)
        throw err
      }

      console.log("[UT] onUploadComplete DONE — returning success")
      return { message: "Resume uploaded successfully" }
    }),
} satisfies FileRouter

export type CustomFileRouter = typeof customFileRouter
