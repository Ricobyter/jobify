import { ConversationList } from "@/features/chat/components/ConversationList"
import { getApplicantConversations } from "@/features/chat/db/conversations"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { MessageSquareIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

export default async function JobSeekerMessagesLayout({
  children,
}: {
  children: ReactNode
}) {
  const { userId } = await getCurrentUser()
  if (!userId) redirect("/sign-in")

  const conversations = await getApplicantConversations(userId)

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
              partnerName: c.organizationName,
              partnerImageUrl: c.organizationImageUrl ?? null,
              updatedAt: c.updatedAt,
            }))}
            basePath="/messages"
          />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
