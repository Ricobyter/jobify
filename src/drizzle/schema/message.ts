import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core"
import { ConversationTable } from "./conversation"
import { UserTable } from "./user"
import { id, createdAt } from "../schemaHelpers"

export const MessageTable = pgTable("messages", {
  id,
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => ConversationTable.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt,
})
