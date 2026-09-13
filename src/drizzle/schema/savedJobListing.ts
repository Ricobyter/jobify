import { pgTable, primaryKey, uuid, varchar } from "drizzle-orm/pg-core"
import { JobListingTable } from "./jobListing"
import { UserTable } from "./user"
import { createdAt } from "../schemaHelpers"
import { relations } from "drizzle-orm"

export const SavedJobListingTable = pgTable(
  "saved_job_listings",
  {
    jobListingId: uuid()
      .references(() => JobListingTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: varchar()
      .references(() => UserTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt,
  },
  table => [primaryKey({ columns: [table.jobListingId, table.userId] })]
)

export const savedJobListingRelations = relations(
  SavedJobListingTable,
  ({ one }) => ({
    jobListing: one(JobListingTable, {
      fields: [SavedJobListingTable.jobListingId],
      references: [JobListingTable.id],
    }),
    user: one(UserTable, {
      fields: [SavedJobListingTable.userId],
      references: [UserTable.id],
    }),
  })
)
