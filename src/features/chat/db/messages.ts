import { db } from "@/drizzle/db"
import { MessageTable, UserTable } from "@/drizzle/schema"
import { asc, eq } from "drizzle-orm"

export async function getConversationMessages(conversationId: string) {
  return db
    .select({
      id: MessageTable.id,
      conversationId: MessageTable.conversationId,
      senderId: MessageTable.senderId,
      senderName: UserTable.name,
      senderImageUrl: UserTable.imageUrl,
      content: MessageTable.content,
      createdAt: MessageTable.createdAt,
    })
    .from(MessageTable)
    .innerJoin(UserTable, eq(MessageTable.senderId, UserTable.id))
    .where(eq(MessageTable.conversationId, conversationId))
    .orderBy(asc(MessageTable.createdAt))
}

export async function insertMessage({
  conversationId,
  senderId,
  content,
}: {
  conversationId: string
  senderId: string
  content: string
}) {
  const [message] = await db
    .insert(MessageTable)
    .values({ conversationId, senderId, content })
    .returning()
  return message
}
