import { z } from "zod"

export const newJobListingApplicationSchema = z.object({
  resumeId: z.string().min(1),
  coverLetter: z
    .string()
    .transform(val => (val.trim() === "" ? null : val))
    .nullable(),
})
