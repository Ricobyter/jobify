import { db } from "@/drizzle/db"
import { inngest } from "../client"
import { eq } from "drizzle-orm"
import { UserResumeTable } from "@/drizzle/schema"
import { env } from "@/data/env/server"
import { updateUserResume } from "@/features/users/db/userResumes"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const createAiSummaryOfUploadedResume = inngest.createFunction(
  {
    id: "create-ai-summary-of-uploaded-resume",
    name: "Create AI Summary of Uploaded Resume",
  },
  {
    event: "app/resume.uploaded",
  },
  async ({ step, event }) => {
    const { userId, resumeId } = event.data

    const userResume = await step.run("get-user-resume", async () => {
      return await db.query.UserResumeTable.findFirst({
        where: eq(UserResumeTable.id, resumeId),
        columns: { resumeFileUrl: true },
      })
    })

    if (userResume == null) return

    const resultText = await step.run("create-ai-summary", async () => {
      const response = await fetch(userResume.resumeFileUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch resume file: ${response.status}`)
      }

      const pdfData = Buffer.from(await response.arrayBuffer()).toString("base64")
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfData,
          },
        },
        "Summarize the following resume and extract all key skills, experience, and qualifications. The summary should include all the information that a hiring manager would need to know about the candidate in order to determine if they are a good fit for a job. Format the summary as markdown. Do not return any other text. If the file does not look like a resume return the text 'N/A'.",
      ])

      return result.response.text().trim()
    })

    await step.run("save-ai-summary", async () => {
      if (resultText.length === 0) return

      await updateUserResume(resumeId, { aiSummary: resultText })
    })
  }
)
