"use server"

import Groq from "groq-sdk"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { db } from "@/drizzle/db"
import { UserResumeTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { env } from "@/data/env/server"
import { getUserResumes } from "@/features/users/db/userResumes"

export type ChatMessage = { role: "user" | "assistant"; content: string }

export type EvaluationResult = {
  summary: string
  rating: number
  strengths: string[]
  weaknesses: string[]
  communication: string
  improvement_plan: string[]
  hire_recommendation: "yes" | "no" | "maybe"
}

function buildSystemPrompt(
  resumeText: string,
  jobRole: string,
  mode: "voice" | "text",
  lastUserAnswer: string,
  chatHistory: ChatMessage[],
  questionCount: number,
  isComplete: boolean
) {
  const resumeReady =
    resumeText.trim() !== "" &&
    !resumeText.startsWith(
      "Resume is uploaded, but AI summary is still processing"
    )

  return `You are an AI interviewer integrated into this app.

Your job is to:
1. Conduct a structured, adaptive interview
2. Evaluate the candidate
3. Provide a final rating and improvement feedback

You must behave like a real interviewer.

---

INPUT:

RESUME_TEXT:
${resumeText}

JOB_ROLE:
${jobRole}

INTERVIEW_MODE:
${mode}

LAST_USER_ANSWER:
${lastUserAnswer}

CHAT_HISTORY:
${JSON.stringify(chatHistory)}

QUESTION_COUNT:
${questionCount}

INTERVIEW_COMPLETE:
${isComplete}

---

CORE BEHAVIOR:

You operate in TWO MODES:

-----------------------------------
MODE 1: INTERVIEW (INTERVIEW_COMPLETE = false)
-----------------------------------

1. Ask ONLY ONE question at a time

2. Flow:

IF QUESTION_COUNT == 0:
→ Start with intro + easy question from resume

ELSE:
→ Adapt based on LAST_USER_ANSWER:
   - Strong → deeper / edge case
   - Weak → simpler / conceptual

3. Question types:
- Project-based
- Technical
- Scenario
- Follow-up

4. Difficulty:
easy → medium → hard

5. Constraints:
- No generic questions
- No repetition
- No multiple questions
- Stay strictly resume-based

8. Resume grounding:
- RESUME_READY: ${resumeReady}
- If RESUME_READY is true, every interview question must reference a specific
  detail from RESUME_TEXT (project, technology, responsibility, achievement,
  or experience) and tie it to JOB_ROLE.
- If RESUME_READY is false, ask role-specific questions without pretending to
  know resume details.

6. Voice Mode:
- 1–2 sentences
- Conversational tone

7. Text Mode:
- Professional and clear

---

OUTPUT (INTERVIEW MODE):

Return ONLY the next question (plain text)

---

-----------------------------------
MODE 2: EVALUATION (INTERVIEW_COMPLETE = true)
-----------------------------------

Now STOP asking questions.

Analyze entire CHAT_HISTORY and generate:

1. Overall performance
2. Technical strengths
3. Weak areas
4. Communication quality
5. Final rating (0–10)
6. Clear improvement steps

---

OUTPUT (EVALUATION MODE - STRICT JSON):

{
  "summary": "short overall performance summary",
  "rating": 0-10,
  "strengths": [
    "point 1",
    "point 2"
  ],
  "weaknesses": [
    "point 1",
    "point 2"
  ],
  "communication": "brief comment",
  "improvement_plan": [
    "actionable step 1",
    "actionable step 2"
  ],
  "hire_recommendation": "yes | no | maybe"
}

---

EVALUATION RULES:

- Be honest, not overly nice
- Avoid generic feedback
- Base everything on actual answers
- Keep feedback actionable

---

FAIL-SAFE RULES:

- If answers are too short → mention lack of depth
- If strong → highlight specific strengths
- Do NOT hallucinate skills

---

IMPORTANT:

- NEVER mix interview + evaluation in same response
- IF INTERVIEW_COMPLETE = false → ONLY question
- IF INTERVIEW_COMPLETE = true → ONLY JSON

---

GOAL:

Simulate a real interview + recruiter-style evaluation.`
}

export async function getUserResumeText(): Promise<string> {
  const { userId } = await getCurrentUser()
  if (!userId) return ""

  const resume = await db.query.UserResumeTable.findFirst({
    where: eq(UserResumeTable.userId, userId),
    columns: { aiSummary: true, resumeFileUrl: true },
  })

  if (resume?.aiSummary != null && resume.aiSummary.trim() !== "") {
    return resume.aiSummary
  }

  if (resume?.resumeFileUrl != null) {
    return "Resume is uploaded, but AI summary is still processing. Continue the interview using role-specific questions without resume-specific assumptions."
  }

  return ""
}

export async function getUserResumeOptions(): Promise<
  {
    id: string
    title: string
    resumeText: string
  }[]
> {
  const { userId } = await getCurrentUser()
  if (!userId) return []

  const resumes = await getUserResumes(userId)

  return resumes.map(resume => ({
    id: resume.id,
    title: resume.title,
    resumeText:
      resume.aiSummary != null && resume.aiSummary.trim() !== ""
        ? resume.aiSummary
        : resume.resumeFileUrl != null
          ? "Resume is uploaded, but AI summary is still processing. Continue the interview using role-specific questions without resume-specific assumptions."
          : "",
  }))
}

export async function sendInterviewMessage({
  jobRole,
  mode,
  chatHistory,
  questionCount,
  isComplete,
  resumeText,
}: {
  jobRole: string
  mode: "voice" | "text"
  chatHistory: ChatMessage[]
  questionCount: number
  isComplete: boolean
  resumeText: string
}): Promise<
  | { error: true; message: string }
  | { error: false; response: string; isEvaluation: boolean }
> {
  const { userId } = await getCurrentUser()
  if (!userId) {
    return { error: true, message: "You must be signed in to use mock interviews" }
  }

  const lastUserAnswer =
    chatHistory.findLast(m => m.role === "user")?.content ?? ""

  const systemPrompt = buildSystemPrompt(
    resumeText || "No resume provided. Ask general questions for the role.",
    jobRole,
    mode,
    lastUserAnswer,
    chatHistory,
    questionCount,
    isComplete
  )

  const triggerMessage = isComplete
    ? "Please evaluate my interview performance now and return only the JSON evaluation."
    : questionCount === 0
      ? "Start the interview. Introduce yourself briefly and ask me the first question."
      : "Continue the interview. Ask me the next question based on my last answer."

  const groq = new Groq({ apiKey: env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: triggerMessage },
    ],
  })

  const text = completion.choices[0]?.message?.content?.trim() ?? ""

  return { error: false, response: text, isEvaluation: isComplete }
}
