import { inngest } from "../client"
import { env } from "@/data/env/server"
import { getUserResumeById, updateUserResume } from "@/features/users/db/userResumes"
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
    console.log('[Inngest] Resume.uploaded event received:', { userId, resumeId })

    const userResume = await step.run("get-user-resume", async () => {
      try {
        const resume = await getUserResumeById(userId, resumeId)
        console.log('[Inngest] getUserResumeById result:', resume)
        return resume == null ? null : { resumeFileUrl: resume.resumeFileUrl }
      } catch (err) {
        console.error('[Inngest] getUserResumeById failed:', err)
        throw err
      }
    })

    if (userResume == null) {
      console.warn('[Inngest] Resume not found, skipping AI summary')
      return
    }

    const resultText = await step.run("create-ai-summary", async () => {
      try {
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

        const text = result.response.text().trim()
        console.log('[Inngest] AI summary generated, length:', text.length)
        return text
      } catch (err) {
        console.error('[Inngest] AI summary generation failed:', err)
        throw err
      }
    })

    await step.run("save-ai-summary", async () => {
      if (resultText.length === 0) {
        console.warn('[Inngest] Empty summary text, skipping save')
        return
      }

      try {
        await updateUserResume(resumeId, { aiSummary: resultText })
        console.log('[Inngest] AI summary saved successfully')
      } catch (err) {
        console.error('[Inngest] Failed to save AI summary:', err)
        throw err
      }
    })
  }
)
