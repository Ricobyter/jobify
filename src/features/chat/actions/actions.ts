"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/drizzle/db"
import { ConversationTable, MessageTable, UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"
import { getOrCreateConversation } from "../db/conversations"
import { insertMessage } from "../db/messages"

export async function startEmployerChat(
  jobListingId: string,
  applicantId: string
) {
  const { orgId } = await getCurrentOrganization()
  if (!orgId) throw new Error("No organization selected")

  const conversation = await getOrCreateConversation({
    jobListingId,
    organizationId: orgId,
    applicantId,
  })

  redirect(`/employer/messages/${conversation.id}`)
}

export async function sendMessage(conversationId: string, content: string) {
  const { userId, orgId } = await auth()
  if (!userId) return { error: "Unauthorized" as const }
  if (!content.trim()) return { error: "Empty message" as const }

  const [conversation] = await db
    .select()
    .from(ConversationTable)
    .where(eq(ConversationTable.id, conversationId))

  if (!conversation) return { error: "Conversation not found" as const }

  const isApplicant = conversation.applicantId === userId
  const isEmployer = orgId === conversation.organizationId
  if (!isApplicant && !isEmployer) return { error: "Unauthorized" as const }

  const message = await insertMessage({
    conversationId,
    senderId: userId,
    content: content.trim(),
  })

  const [user] = await db
    .select({ name: UserTable.name, imageUrl: UserTable.imageUrl })
    .from(UserTable)
    .where(eq(UserTable.id, userId))

  return {
    message: {
      ...message,
      senderName: user?.name ?? "Unknown",
      senderImageUrl: user?.imageUrl ?? null,
      createdAt: message.createdAt.toISOString(),
    },
  }
}
