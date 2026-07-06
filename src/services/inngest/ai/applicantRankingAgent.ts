import { env } from "@/data/env/server"
import { updateJobListingApplication } from "@/features/jobListingApplications/db/jobListingsApplications"
import { createAgent, createTool, openai } from "@inngest/agent-kit"
import { z } from "zod"

// jobListingId/userId are bound from the known event data (see jobListingApplication.ts),
// not taken from the model's tool call args — the model can't be trusted to echo IDs back
// correctly, and a mismatched WHERE clause on update() fails silently (0 rows, no error).
export function createApplicantRankingAgent({
  jobListingId,
  userId,
}: {
  jobListingId: string
  userId: string
}) {
  const saveApplicantRatingTool = createTool({
    name: "save-applicant-ranking",
    description:
      "Saves the applicant's ranking for this specific job listing in the database",
    parameters: z.object({
      rating: z.number().int().max(5).min(1),
    }),
    handler: async ({ rating }) => {
      console.log("[applicantRankingAgent] saving rating", {
        jobListingId,
        userId,
        rating,
      })
      await updateJobListingApplication({ jobListingId, userId }, { rating })

      return "Successfully saved applicant ranking score."
    },
  })

  return createAgent({
    name: "Applicant Ranking Agent",
    description:
      "Agent for ranking job applicants for specific job listings based on their resume and cover letter.",
    system:
      "You are an expert at ranking job applicants for specific jobs based on job requirements, resume summary, and cover letter. You will be provided a JSON payload with jobListing, coverLetter, resumeSummary, and isProvisional. Compare the applicant details against the job listing and assign a rating from 1 to 5, where 5 is an excellent fit, 3 is a borderline fit, and 1 is a poor fit. If isProvisional is true or resumeSummary is missing, compute a provisional rating from the coverLetter and jobListing only, and still save the rating. Always call the save-applicant-ranking tool and do not return normal text output.",
    tools: [saveApplicantRatingTool],
    tool_choice: "save-applicant-ranking",
    model: openai({
      model: "openai/gpt-oss-120b",
      apiKey: env.GROQ_API_KEY,
      baseUrl: "https://api.groq.com/openai/v1/",
    }),
  })
}
