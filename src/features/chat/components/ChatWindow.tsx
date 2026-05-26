"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { sendMessage } from "@/features/chat/actions/actions"
import { format } from "date-fns"
import { SendIcon } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import { io, Socket } from "socket.io-client"

type Message = {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderImageUrl: string | null
  content: string
  createdAt: Date | string
}

export function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
  partnerName,
  partnerImageUrl,
}: {
  conversationId: string
  currentUserId: string
  initialMessages: Message[]
  partnerName: string
  partnerImageUrl?: string | null
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const socketRef = useRef<Socket | null>(null)
  const broadcastRef = useRef<((msg: Message) => void) | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on load and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Socket.io setup
  useEffect(() => {
    const socket = io({ path: "/api/socketio", addTrailingSlash: false })
    socketRef.current = socket

    broadcastRef.current = (msg: Message) => {
      socket.emit("broadcast-message", { conversationId, message: msg })
    }

    socket.emit("join-conversation", conversationId)

    socket.on("new-message", (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [
          ...prev,
          { ...msg, createdAt: new Date(msg.createdAt as string) },
        ]
      })
    })

    return () => {
      socket.emit("leave-conversation", conversationId)
      socket.disconnect()
    }
  }, [conversationId])

  const handleSend = () => {
    const trimmed = content.trim()
    if (!trimmed || isPending) return
    setContent("")
    inputRef.current?.focus()

    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      senderName: "You",
      senderImageUrl: null,
      content: trimmed,
      createdAt: new Date(),
    }
    setMessages(prev => [...prev, optimistic])

    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed)
      const msg = result && "message" in result ? result.message : null
      if (msg != null) {
        const saved: Message = {
          id: msg.id ?? tempId,
          conversationId: msg.conversationId ?? conversationId,
          senderId: msg.senderId ?? currentUserId,
          senderName: msg.senderName,
          senderImageUrl: msg.senderImageUrl,
          content: msg.content ?? trimmed,
          createdAt: new Date(msg.createdAt),
        }
        setMessages(prev => prev.map(m => (m.id === tempId ? saved : m)))
        broadcastRef.current?.(saved)
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
      }
    })
  }

  const partnerInitials = partnerName
    .split(" ")
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Avatar className="size-8">
          <AvatarImage src={partnerImageUrl ?? undefined} />
          <AvatarFallback className="text-xs">{partnerInitials}</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{partnerName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">
            No messages yet — say hello!
          </p>
        )}
        {messages.map(msg => {
          const isOwn = msg.senderId === currentUserId
          const initials = msg.senderName
            .split(" ")
            .slice(0, 2)
            .map(n => n[0]?.toUpperCase() ?? "")
            .join("")
          const time = format(new Date(msg.createdAt), "h:mm a")

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {!isOwn && (
                <Avatar className="size-7 shrink-0 mt-1">
                  <AvatarImage src={msg.senderImageUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 text-sm break-words leading-relaxed ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2 shrink-0">
        <input
          ref={inputRef}
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Type a message…"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isPending}
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          onClick={handleSend}
          disabled={isPending || !content.trim()}
        >
          <SendIcon className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  )
}
