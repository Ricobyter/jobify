import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { getCurrentUser } from "../clerk/lib/getCurrentAuth"
import { inngest } from "../inngest/client"
import { upsertUserResume } from "@/features/users/db/userResumes"
import { db } from "@/drizzle/db"
import { eq } from "drizzle-orm"
import { UserResumeTable } from "@/drizzle/schema"
import { uploadthing } from "./client"
import { ensureCurrentUserInDb } from "../clerk/lib/syncAuthToDb"

const f = createUploadthing()

export const customFileRouter = {
  resumeUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await getCurrentUser()
      if (userId == null) throw new UploadThingError("Unauthorized")

      try {
        await ensureCurrentUserInDb(userId)
      } catch (err) {
        console.error("[UT] Failed to sync current user into DB:", err)
        throw new UploadThingError("Unable to prepare user profile for upload")
      }

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] onUploadComplete START", { userId: metadata.userId, fileKey: file.key, ufsUrl: file.ufsUrl })
      const { userId } = metadata
      const resumeFileKey = await getUserResumeFileKey(userId)
      console.log("[UT] existing resumeFileKey:", resumeFileKey)

      try {
        await upsertUserResume(userId, {
          resumeFileUrl: file.ufsUrl,
          resumeFileKey: file.key,
        })
        console.log("[UT] upsertUserResume done")
      } catch (err) {
        console.error("[UT] upsertUserResume FAILED:", err)
        throw err
      }

      if (resumeFileKey != null) {
        await uploadthing.deleteFiles(resumeFileKey).catch(err =>
          console.error("[UT] Failed to delete old resume file:", err)
        )
        console.log("[UT] deleteFiles done")
      }

      inngest
        .send({ name: "app/resume.uploaded", user: { id: userId } })
        .catch(err => console.error("[UT] Failed to send inngest event:", err))

      console.log("[UT] onUploadComplete DONE — returning success")
      return { message: "Resume uploaded successfully" }
    }),
} satisfies FileRouter

export type CustomFileRouter = typeof customFileRouter

async function getUserResumeFileKey(userId: string) {
  const data = await db.query.UserResumeTable.findFirst({
    where: eq(UserResumeTable.userId, userId),
    columns: { resumeFileKey: true },
  })
  return data?.resumeFileKey
}
