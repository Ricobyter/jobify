import { ConversationList } from "@/features/chat/components/ConversationList"
import { getEmployerConversations } from "@/features/chat/db/conversations"
import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"
import { MessageSquareIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

export default async function EmployerMessagesLayout({
  children,
}: {
  children: ReactNode
}) {
  const { orgId } = await getCurrentOrganization()
  if (!orgId) redirect("/")

  const conversations = await getEmployerConversations(orgId)

  return (
    <div className="flex h-svh overflow-hidden">
      {/* Conversation list panel */}
      <div className="w-72 border-r flex flex-col shrink-0">
        <div className="px-4 py-3 border-b flex items-center gap-2 font-semibold">
          <MessageSquareIcon className="size-4" />
          Messages
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations.map(c => ({
              id: c.id,
              title: c.jobListingTitle,
              partnerName: c.applicantName,
              partnerImageUrl: c.applicantImageUrl,
              updatedAt: c.updatedAt,
            }))}
            basePath="/employer/messages"
          />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
