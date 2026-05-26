import { db } from "@/drizzle/db"
import {
  ConversationTable,
  JobListingTable,
  OrganizationTable,
  UserTable,
} from "@/drizzle/schema"
import { and, desc, eq } from "drizzle-orm"

export async function getOrCreateConversation({
  jobListingId,
  organizationId,
  applicantId,
}: {
  jobListingId: string
  organizationId: string
  applicantId: string
}) {
  const [existing] = await db
    .select()
    .from(ConversationTable)
    .where(
      and(
        eq(ConversationTable.jobListingId, jobListingId),
        eq(ConversationTable.applicantId, applicantId)
      )
    )

  if (existing) return existing

  const [created] = await db
    .insert(ConversationTable)
    .values({ jobListingId, organizationId, applicantId })
    .returning()

  return created
}

export async function getConversationById(id: string) {
  const [conversation] = await db
    .select()
    .from(ConversationTable)
    .where(eq(ConversationTable.id, id))
  return conversation ?? null
}

export async function getEmployerConversations(organizationId: string) {
  return db
    .select({
      id: ConversationTable.id,
      jobListingId: ConversationTable.jobListingId,
      jobListingTitle: JobListingTable.title,
      applicantId: ConversationTable.applicantId,
      applicantName: UserTable.name,
      applicantImageUrl: UserTable.imageUrl,
      updatedAt: ConversationTable.updatedAt,
    })
    .from(ConversationTable)
    .innerJoin(
      JobListingTable,
      eq(ConversationTable.jobListingId, JobListingTable.id)
    )
    .innerJoin(UserTable, eq(ConversationTable.applicantId, UserTable.id))
    .where(eq(ConversationTable.organizationId, organizationId))
    .orderBy(desc(ConversationTable.updatedAt))
}

export async function getApplicantConversations(applicantId: string) {
  return db
    .select({
      id: ConversationTable.id,
      jobListingId: ConversationTable.jobListingId,
      jobListingTitle: JobListingTable.title,
      organizationId: ConversationTable.organizationId,
      organizationName: OrganizationTable.name,
      organizationImageUrl: OrganizationTable.imageUrl,
      updatedAt: ConversationTable.updatedAt,
    })
    .from(ConversationTable)
    .innerJoin(
      JobListingTable,
      eq(ConversationTable.jobListingId, JobListingTable.id)
    )
    .innerJoin(
      OrganizationTable,
      eq(ConversationTable.organizationId, OrganizationTable.id)
    )
    .where(eq(ConversationTable.applicantId, applicantId))
    .orderBy(desc(ConversationTable.updatedAt))
}
