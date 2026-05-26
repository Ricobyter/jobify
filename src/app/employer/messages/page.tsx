import { MessageSquareIcon } from "lucide-react"

export default function EmployerMessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <MessageSquareIcon className="size-12 opacity-20" />
      <p className="text-sm">Select a conversation to start chatting</p>
    </div>
  )
}
