import { ChatWindow } from "@/features/chat/components/ChatWindow"
import { getConversationById } from "@/features/chat/db/conversations"
import { getConversationMessages } from "@/features/chat/db/messages"
import { db } from "@/drizzle/db"
import { OrganizationTable } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ conversationId: string }> }

export default async function JobSeekerConversationPage({ params }: Props) {
  const { conversationId } = await params
  const { userId } = await getCurrentUser()
  if (!userId) notFound()

  const conversation = await getConversationById(conversationId)
  if (!conversation || conversation.applicantId !== userId) notFound()

  const [messages, org] = await Promise.all([
    getConversationMessages(conversationId),
    db
      .select({ name: OrganizationTable.name, imageUrl: OrganizationTable.imageUrl })
      .from(OrganizationTable)
      .where(eq(OrganizationTable.id, conversation.organizationId))
      .then(rows => rows[0] ?? null),
  ])

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={userId}
      initialMessages={messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      partnerName={org?.name ?? "Employer"}
      partnerImageUrl={org?.imageUrl}
    />
  )
}
