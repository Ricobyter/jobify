import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { createdAt, updatedAt } from "../schemaHelpers"
import { UserTable } from "./user"
import { relations } from "drizzle-orm"

export const UserResumeTable = pgTable("user_resumes", {
  id: uuid().primaryKey().defaultRandom(),
  userId: varchar()
    .references(() => UserTable.id)
    .notNull(),
  title: varchar().notNull(),
  resumeFileUrl: varchar().notNull(),
  resumeFileKey: varchar().notNull(),
  aiSummary: varchar(),
  createdAt,
  updatedAt,
})

export const userResumeRelations = relations(UserResumeTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [UserResumeTable.userId],
    references: [UserTable.id],
  }),
}))
