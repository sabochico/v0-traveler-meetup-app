"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ArrowLeft, Send, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useConversations, useMessages, useSendMessage, Conversation } from "@/hooks/use-messages"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"

// Mock conversations shown when user has no real conversations yet
const MOCK_CONVERSATIONS = [
  {
    id: "mock-1",
    other_user: {
      id: "mock-user-1",
      display_name: "Mika",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      is_online: true,
    },
    last_message: {
      content: "See you at the cafe in 20 min!",
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      sender_id: "mock-user-1",
    },
    unread_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    other_user: {
      id: "mock-user-2",
      display_name: "Leo",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      is_online: false,
    },
    last_message: {
      content: "That ramen spot was incredible, thanks for the recommendation",
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      sender_id: "mock-user-2",
    },
    unread_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    other_user: {
      id: "mock-user-3",
      display_name: "Sofia",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      is_online: true,
    },
    last_message: {
      content: "Are you free tomorrow evening? Want to explore Akihabara",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      sender_id: "mock-user-3",
    },
    unread_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface MessagesViewProps {
  initialConversationId?: string
}

export function MessagesView({ initialConversationId }: MessagesViewProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { conversations, isLoading } = useConversations()
  const hasAutoOpened = useRef(false)

  // Auto-open a conversation once when navigated here from a meetup join.
  // The ref prevents re-opening after the user clicks back.
  useEffect(() => {
    if (!initialConversationId || hasAutoOpened.current) return
    const match = conversations.find(c => c.id === initialConversationId)
    if (match) {
      hasAutoOpened.current = true
      setSelectedConversation(match)
    }
  }, [initialConversationId, conversations])

  // Use mock data if no real conversations
  const displayConversations = conversations.length > 0 ? conversations : MOCK_CONVERSATIONS

  const filteredConversations = searchQuery
    ? displayConversations.filter((c) =>
        c.other_user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayConversations

  if (selectedConversation) {
    return (
      <ChatView
        conversation={selectedConversation}
        onBack={() => setSelectedConversation(null)}
        isMock={conversations.length === 0}
      />
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <h1 className="text-2xl font-serif font-semibold">Messages</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary border-0 pl-10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      {/* Conversations */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="max-w-lg mx-auto divide-y divide-border/50">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Say hi to someone on the Discover page to start chatting
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className="w-full flex items-center gap-4 p-4 hover:bg-card/50 transition-colors text-left"
              >
                <div className="relative">
                  <Avatar className="w-14 h-14">
                    <AvatarImage
                      src={conversation.other_user.avatar_url ?? undefined}
                      alt={conversation.other_user.display_name ?? "User"}
                    />
                    <AvatarFallback>
                      {(conversation.other_user.display_name ?? "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.other_user.is_online && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground">
                      {conversation.other_user.display_name ?? "Anonymous"}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {conversation.last_message
                        ? formatDistanceToNow(new Date(conversation.last_message.created_at))
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message?.content ?? "Start the conversation"}
                  </p>
                </div>

                {conversation.unread_count > 0 && (
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    {conversation.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface ChatViewProps {
  conversation: Conversation
  onBack: () => void
  isMock?: boolean
}

function ChatView({ conversation, onBack, isMock = false }: ChatViewProps) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [localMessages, setLocalMessages] = useState<Array<{
    id: string
    content: string
    sender_id: string
    created_at: string
  }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, refresh } = useMessages(isMock ? null : conversation.id)
  const { sendMessage, markAsRead } = useSendMessage()

  // Initialize with mock messages or real messages
  useEffect(() => {
    if (isMock) {
      // Generate mock chat messages
      setLocalMessages([
        {
          id: "1",
          content: "Hey! I saw you're in Shibuya too. Want to grab a coffee?",
          sender_id: conversation.other_user.id,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          content: "Sure! I know a great spot near the station",
          sender_id: "me",
          created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          content: conversation.last_message?.content ?? "See you soon!",
          sender_id: conversation.other_user.id,
          created_at: conversation.last_message?.created_at ?? new Date().toISOString(),
        },
      ])
    } else {
      setLocalMessages(messages)
    }
  }, [messages, isMock, conversation.other_user.id, conversation.last_message])

  // Mark messages as read (separate effect to avoid infinite loop)
  useEffect(() => {
    if (!isMock && messages.length > 0) {
      markAsRead(conversation.id)
    }
    // Only run once when conversation changes, not when markAsRead changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, isMock, messages.length])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [localMessages])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    if (isMock) {
      // Add message locally for mock mode
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          content: messageContent,
          sender_id: "me",
          created_at: new Date().toISOString(),
        },
      ])
      
      // Simulate response after delay
      setTimeout(() => {
        setLocalMessages((prev) => [
          ...prev,
          {
            id: `response-${Date.now()}`,
            content: "This is a demo conversation. Connect with real users to chat!",
            sender_id: conversation.other_user.id,
            created_at: new Date().toISOString(),
          },
        ])
      }, 1500)
    } else {
      try {
        await sendMessage(conversation.id, messageContent)
        await refresh()
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    }

    setSending(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Avatar className="w-10 h-10">
            <AvatarImage
              src={conversation.other_user.avatar_url ?? undefined}
              alt={conversation.other_user.display_name ?? "User"}
            />
            <AvatarFallback>
              {(conversation.other_user.display_name ?? "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-foreground truncate">
              {conversation.other_user.display_name ?? "Anonymous"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {conversation.other_user.is_online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {isLoading && !isMock ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : localMessages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            localMessages.map((message) => {
              const isMe = message.sender_id === "me" || message.sender_id !== conversation.other_user.id
              return (
                <div
                  key={message.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2 rounded-2xl",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border/50 text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(message.created_at))}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-secondary border-0"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:glow-amber transition-all"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
