import { pgTable, uuid, varchar, unique } from "drizzle-orm/pg-core"
import { JobListingTable } from "./jobListing"
import { OrganizationTable } from "./organization"
import { UserTable } from "./user"
import { id, createdAt, updatedAt } from "../schemaHelpers"

export const ConversationTable = pgTable(
  "conversations",
  {
    id,
    jobListingId: uuid("job_listing_id")
      .notNull()
      .references(() => JobListingTable.id, { onDelete: "cascade" }),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => OrganizationTable.id, { onDelete: "cascade" }),
    applicantId: varchar("applicant_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt,
  },
  table => [
    unique("one_conversation_per_application").on(
      table.jobListingId,
      table.applicantId
    ),
  ]
)
