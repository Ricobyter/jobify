import { ChatWindow } from "@/features/chat/components/ChatWindow"
import { getConversationById } from "@/features/chat/db/conversations"
import { getConversationMessages } from "@/features/chat/db/messages"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ conversationId: string }> }

export default async function EmployerConversationPage({ params }: Props) {
  const { conversationId } = await params
  const { userId } = await auth()
  const { orgId } = await getCurrentOrganization()

  if (!userId || !orgId) notFound()

  const conversation = await getConversationById(conversationId)
  if (!conversation || conversation.organizationId !== orgId) notFound()

  const [messages, applicant] = await Promise.all([
    getConversationMessages(conversationId),
    db
      .select({ name: UserTable.name, imageUrl: UserTable.imageUrl })
      .from(UserTable)
      .where(eq(UserTable.id, conversation.applicantId))
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
      partnerName={applicant?.name ?? "Applicant"}
      partnerImageUrl={applicant?.imageUrl}
    />
  )
}
