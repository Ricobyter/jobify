"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useParams } from "next/navigation"

type Conversation = {
  id: string
  title: string
  partnerName: string
  partnerImageUrl: string | null
  updatedAt: Date
}

export function ConversationList({
  conversations,
  basePath,
}: {
  conversations: Conversation[]
  basePath: string
}) {
  const params = useParams()
  const currentId = params?.conversationId as string | undefined

  if (conversations.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground text-center">
        No conversations yet
      </p>
    )
  }

  return (
    <ul className="space-y-px p-2">
      {conversations.map(conv => {
        const initials = conv.partnerName
          .split(" ")
          .slice(0, 2)
          .map(n => n[0]?.toUpperCase() ?? "")
          .join("")

        return (
          <li key={conv.id}>
            <Link
              href={`${basePath}/${conv.id}`}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted",
                currentId === conv.id && "bg-muted"
              )}
            >
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={conv.partnerImageUrl ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {conv.partnerName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.title}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(conv.updatedAt, { addSuffix: false })}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
