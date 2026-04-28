import { inngest } from "../client"
import { env } from "@/data/env/server"
import { getUserResumeById, updateUserResume } from "@/features/users/db/userResumes"
import { GoogleGenerativeAI } from "@google/generative-ai"

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error
      const message = lastError.message || ""

      // Check if it's a quota error
      if (message.includes("429") || message.includes("quota")) {
        const waitTime = Math.pow(2, attempt - 1) * 5000 // 5s, 10s, 20s
        console.warn(
          `[Inngest] Quota limit hit, attempt ${attempt}/${maxAttempts}, waiting ${waitTime}ms...`
        )
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      }

      // Non-retryable error or final attempt
      if (attempt === maxAttempts) {
        throw lastError
      }

      // Other transient errors: retry after short delay
      const waitTime = 1000 * attempt
      console.warn(
        `[Inngest] Error on attempt ${attempt}/${maxAttempts}, retrying in ${waitTime}ms:`,
        message.slice(0, 100)
      )
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

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

        if (!resume) return null

        // Skip if already summarized (quota saver for re-uploads)
        if (resume.aiSummary && resume.aiSummary.trim().length > 0) {
          console.log('[Inngest] Resume already has AI summary, skipping')
          return null
        }

        return { resumeFileUrl: resume.resumeFileUrl }
      } catch (err) {
        console.error('[Inngest] getUserResumeById failed:', err)
        throw err
      }
    })

    if (userResume == null) {
      console.log('[Inngest] Skipping AI summary (not needed or not found)')
      return
    }

    const resultText = await step.run("create-ai-summary", async () => {
      try {
        return await retryWithExponentialBackoff(async () => {
          const response = await fetch(userResume.resumeFileUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch resume file: ${response.status}`)
          }

          const pdfData = Buffer.from(await response.arrayBuffer()).toString("base64")
          const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

          console.log('[Inngest] Calling Gemini API...')
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
        }, 3)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error('[Inngest] AI summary generation failed:', errorMsg.slice(0, 200))

        // Graceful fallback: return placeholder on quota/auth errors
        if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("403")) {
          console.warn(
            '[Inngest] API quota/auth exceeded. Returning placeholder summary.'
          )
          return "⏳ AI summary pending - API quota reached. Please try again later."
        }

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
