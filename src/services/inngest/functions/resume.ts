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
        // Fetch file and attempt text extraction
        const fetchResp = await fetch(userResume.resumeFileUrl)
        if (!fetchResp.ok) {
          throw new Error(`Failed to fetch resume file: ${fetchResp.status}`)
        }

        const fileBuffer = Buffer.from(await fetchResp.arrayBuffer())

        // Try to extract text from PDF for GROQ (text-model) summarization
        let extractedText = ""
        try {
          const pdfModule = await import("pdf-parse")
          const pdfRes = (await pdfModule.default(fileBuffer)) as { text?: string }
          extractedText = (pdfRes.text || "").trim()
          console.log('[Inngest] Extracted text length from PDF:', extractedText.length)
        } catch (err) {
          console.warn('[Inngest] PDF text extraction failed, will skip GROQ path:', err)
        }

        // If we have meaningful extracted text, prefer GROQ chat model first
        if (extractedText && extractedText.length > 50 && env.GROQ_API_KEY) {
          try {
            const Groq = (await import('groq-sdk')).default
            const groq = new Groq({ apiKey: env.GROQ_API_KEY })
            const prompt = `Summarize the following resume and extract all key skills, experience, and qualifications. Format the summary as markdown. If the content does not look like a resume return 'N/A'.\n\n${extractedText}`

            console.log('[Inngest] Calling GROQ chat model for resume summarization...')
            const completion = await groq.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              max_tokens: 1500,
              messages: [
                { role: 'system', content: 'You summarize resumes.' },
                { role: 'user', content: prompt },
              ],
            })

            const groqText = completion.choices?.[0]?.message?.content?.trim() ?? ""
            if (groqText && groqText.length > 0) {
              console.log('[Inngest] GROQ summary generated, length:', groqText.length)
              return groqText
            }
          } catch (err) {
            console.warn('[Inngest] GROQ summarization failed, falling back:', err)
          }
        }

        // If GROQ path not used or failed, continue with Gemini primary/alternate
        // Helper to call Gemini with a specific API key
        const callGeminiWithKey = async (apiKey: string) => {
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

          console.log('[Inngest] Calling Gemini API with provided key...')
          const result = await model.generateContent([
            {
              inlineData: {
                mimeType: "application/pdf",
                data: fileBuffer.toString("base64"),
              },
            },
            "Summarize the following resume and extract all key skills, experience, and qualifications. The summary should include all the information that a hiring manager would need to know about the candidate in order to determine if they are a good fit for a job. Format the summary as markdown. Do not return any other text. If the file does not look like a resume return the text 'N/A'.",
          ])

          return result.response.text().trim()
        }

        // Try primary GEMINI key first with retries
        try {
          return await retryWithExponentialBackoff(() => callGeminiWithKey(env.GEMINI_API_KEY), 3)
        } catch (primaryErr) {
          const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
          console.warn('[Inngest] Primary Gemini key failed:', primaryMsg.slice(0, 200))

          // If user provided a secondary Google-like key (GQOQ_API_KEY), try that next
          if (env.GQOQ_API_KEY && env.GQOQ_API_KEY !== env.GEMINI_API_KEY) {
            try {
              console.log('[Inngest] Trying alternate GQOQ API key')
              return await retryWithExponentialBackoff(() => callGeminiWithKey(env.GQOQ_API_KEY as string), 3)
            } catch (altErr) {
              console.warn('[Inngest] Alternate GQOQ key also failed:', (altErr instanceof Error ? altErr.message : String(altErr)).slice(0,200))
            }
          }

          // Rethrow the original error to trigger outer fallback handling
          throw primaryErr
        }
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
