"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { Search, ArrowLeft, Send, Loader2, MapPin, Plane, Globe, Sparkles, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useConversations, useMessages, useSendMessage, Conversation } from "@/hooks/use-messages"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useBlockedUsers } from "@/hooks/use-user-safety"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { motionEase, quickTransition } from "@/lib/motion"
import { getPresenceStatus } from "@/lib/presence"

const SHOW_MOCK_DATA = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SHOW_MOCK_DATA === "true"

// Mock conversations shown in development when user has no real conversations yet.
const MOCK_CONVERSATIONS = [
  {
    id: "mock-1",
    meetup_id: null,
    other_user: {
      id: "mock-user-1",
      display_name: "Mika",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      is_online: true,
      last_active_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      mood: "social",
      travel_mode: true,
      current_city: "Tokyo",
      current_country: "Japan",
      location: null,
      interests: ["Coffee", "Hidden cafes", "Walking"],
      languages: ["English", "Japanese"],
    },
    last_message: {
      content: "See you at the cafe in 20 min!",
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      sender_id: "mock-user-1",
    },
    unread_count: 2,
    meetup: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    meetup_id: null,
    other_user: {
      id: "mock-user-2",
      display_name: "Leo",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      is_online: false,
      last_active_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      last_seen_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      mood: "exploring",
      travel_mode: false,
      current_city: "Tokyo",
      current_country: "Japan",
      location: null,
      interests: ["Ramen", "Food markets", "Recommendations"],
      languages: ["English"],
    },
    last_message: {
      content: "That ramen spot was incredible, thanks for the recommendation",
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      sender_id: "mock-user-2",
    },
    unread_count: 0,
    meetup: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    meetup_id: null,
    other_user: {
      id: "mock-user-3",
      display_name: "Sofia",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      is_online: true,
      last_active_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      mood: "exploring",
      travel_mode: true,
      current_city: "Tokyo",
      current_country: "Japan",
      location: null,
      interests: ["Night walks", "Anime", "Exploring"],
      languages: ["English", "Spanish"],
    },
    last_message: {
      content: "Are you free tomorrow evening? Want to explore Akihabara",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      sender_id: "mock-user-3",
    },
    unread_count: 1,
    meetup: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function ConversationSkeleton() {
  return (
    <div className="max-w-lg mx-auto divide-y divide-border/50">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-secondary" />
            <div className="h-3 w-44 rounded bg-secondary/70" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MessageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-2/3 rounded-2xl bg-secondary" />
      <div className="ml-auto h-10 w-1/2 rounded-2xl bg-secondary" />
      <div className="h-10 w-3/5 rounded-2xl bg-secondary" />
    </div>
  )
}

interface MessagesViewProps {
  initialConversationId?: string
  onBrowsePeople?: () => void
}

export function MessagesView({ initialConversationId, onBrowsePeople }: MessagesViewProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const prefersReducedMotion = useReducedMotion()
  const { conversations, isLoading } = useConversations()
  const { blockedUserIdSet } = useBlockedUsers()
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
  const displayConversations = useMemo(
    () => conversations.length > 0
      ? conversations.filter((conversation) => !blockedUserIdSet.has(conversation.other_user.id))
      : SHOW_MOCK_DATA ? MOCK_CONVERSATIONS : [],
    [blockedUserIdSet, conversations]
  )
  const isMockData = SHOW_MOCK_DATA && conversations.length === 0

  const filteredConversations = useMemo(
    () => searchQuery
      ? displayConversations.filter((c) =>
        c.other_user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : displayConversations,
    [displayConversations, searchQuery]
  )

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {selectedConversation ? (
        <motion.div
          key={`chat-${selectedConversation.id}`}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
          transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.22, ease: motionEase }}
        >
          <ChatView
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
            isMock={isMockData}
          />
        </motion.div>
      ) : (
        <motion.div
          key="conversation-list"
          className="min-h-screen"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
          transition={prefersReducedMotion ? { duration: 0.01 } : quickTransition}
        >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[var(--drift-safe-top)]">
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
        <ConversationSkeleton />
      ) : (
        <div className="max-w-lg mx-auto divide-y divide-border/50">
          {filteredConversations.length === 0 ? (
            <Empty className="mx-4 my-8 rounded-3xl border border-border/60 bg-card/70 px-5 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="h-14 w-14 rounded-2xl bg-primary/10 text-primary">
                  <MessageCircle className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>
                  {searchQuery ? "No conversations found" : "Start your first chat"}
                </EmptyTitle>
                <EmptyDescription className="max-w-[18rem]">
                  {searchQuery
                    ? "Try searching by another name."
                    : "Find someone nearby, say hi, or join a meetup to open a conversation."}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && onBrowsePeople && (
                <EmptyContent>
                  <button
                    type="button"
                    onClick={onBrowsePeople}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Browse people
                  </button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            filteredConversations.map((conversation, index) => {
              const presence = getPresenceStatus(conversation.other_user)

              return (
              <motion.button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0.01 } : { ...quickTransition, delay: Math.min(index, 8) * 0.025 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="w-full flex items-center gap-4 p-4 hover:bg-card/50 transition-colors text-left"
              >
                <div className="relative">
                  <Avatar className="w-14 h-14">
                    <AvatarImage
                      src={conversation.other_user?.avatar_url ?? undefined}
                      alt={conversation.other_user?.display_name ?? "User"}
                    />
                    <AvatarFallback>
                      {(conversation.other_user?.display_name ?? "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {presence.state !== "offline" && (
                    <span className={cn(
                      "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
                      presence.state === "online" ? "bg-emerald-500" : "bg-muted-foreground"
                    )} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground">
                      {conversation.other_user?.display_name ?? "Anonymous"}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {conversation.last_message
                        ? formatDistanceToNow(new Date(conversation.last_message.created_at))
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.meetup?.title
                      ? `${conversation.meetup.title} · ${conversation.last_message?.content ?? "Start the conversation"}`
                      : conversation.last_message?.content ?? "Start the conversation"}
                  </p>
                </div>

                {conversation.unread_count > 0 && (
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    {conversation.unread_count}
                  </span>
                )}
              </motion.button>
              )
            })
          )}
        </div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
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
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { messages, isLoading } = useMessages(isMock ? null : conversation.id)
  const { sendMessage, markAsRead } = useSendMessage()
  const { toast } = useToast()
  const otherUser = conversation.other_user
  const presence = getPresenceStatus(otherUser)
  const location =
    [otherUser?.current_city, otherUser?.current_country].filter(Boolean).join(", ") ||
    otherUser?.location ||
    "Location not shared"
  const contextTags = [
    ...(otherUser?.interests ?? []).slice(0, 3),
    ...(otherUser?.languages ?? []).slice(0, 2),
  ].slice(0, 4)
  const starter = contextTags[0]
  const composerBottom = keyboardOffset
    ? `${keyboardOffset}px`
    : "calc(5.5rem + env(safe-area-inset-bottom))"
  const scrollBottomPadding = keyboardOffset ? keyboardOffset + 96 : 184
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
  }, [])

  // Initialize with mock messages or real messages
  useEffect(() => {
    if (isMock) {
      // Generate mock chat messages
      setLocalMessages([
        {
          id: "1",
          content: "Hey! I saw you're in Shibuya too. Want to grab a coffee?",
          sender_id: conversation.other_user?.id ?? "",
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
          sender_id: conversation.other_user?.id ?? "",
          created_at: conversation.last_message?.created_at ?? new Date().toISOString(),
        },
      ])
    } else {
      setLocalMessages(messages)
    }
  }, [messages, isMock, conversation.other_user?.id, conversation.last_message?.content, conversation.last_message?.created_at])

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
    scrollToBottom(prefersReducedMotion ? "auto" : "smooth")
  }, [localMessages.length, prefersReducedMotion, scrollToBottom])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const updateKeyboardOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      setKeyboardOffset((current) => Math.abs(current - offset) < 1 ? current : offset)
      requestAnimationFrame(() => scrollToBottom("auto"))
    }

    updateKeyboardOffset()
    viewport.addEventListener("resize", updateKeyboardOffset)
    viewport.addEventListener("scroll", updateKeyboardOffset)
    window.addEventListener("resize", updateKeyboardOffset)

    return () => {
      viewport.removeEventListener("resize", updateKeyboardOffset)
      viewport.removeEventListener("scroll", updateKeyboardOffset)
      window.removeEventListener("resize", updateKeyboardOffset)
    }
  }, [scrollToBottom])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    const messageContent = newMessage.trim()
    console.debug("[Drift messages] send clicked", {
      conversationId: conversation.id,
      isMock,
      contentLength: messageContent.length,
    })
    const tempId = `local-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      sender_id: "me",
      created_at: new Date().toISOString(),
    }
    setNewMessage("")
    setLocalMessages((prev) => [...prev, optimisticMessage])
    requestAnimationFrame(() => scrollToBottom("auto"))

    if (isMock) {
      // Simulate response after delay
      setTimeout(() => {
        setLocalMessages((prev) => [
          ...prev,
          {
            id: `response-${Date.now()}`,
            content: "This is a demo conversation. Connect with real users to chat!",
            sender_id: conversation.other_user?.id ?? "",
            created_at: new Date().toISOString(),
          },
        ])
      }, 1500)
    } else {
      try {
        const savedMessage = await sendMessage(conversation.id, messageContent)
        console.debug("[Drift messages] message saved", {
          conversationId: conversation.id,
          messageId: savedMessage.id,
        })
        setLocalMessages((prev) =>
          prev.map((message) => message.id === tempId ? savedMessage : message)
        )
      } catch (error) {
        console.error("Failed to send message:", error)
        setLocalMessages((prev) => prev.filter((message) => message.id !== tempId))
        setNewMessage(messageContent)
        toast({
          title: "Message was not sent",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        })
      }
    }

    setSending(false)
  }

  const handleUseStarter = () => {
    if (!starter) return

    setNewMessage(`Hey! I saw you're into ${starter}. Want to do something today?`)
    console.debug("[Drift messages] starter applied", { conversationId: conversation.id, starter })
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      scrollToBottom("auto")
    })
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[var(--drift-safe-top)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isMock ? (
            <>
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={conversation.other_user?.avatar_url ?? undefined}
                  alt={conversation.other_user?.display_name ?? "User"}
                />
                <AvatarFallback>
                  {(conversation.other_user?.display_name ?? "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-foreground truncate">
                  {conversation.other_user?.display_name ?? "Anonymous"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {conversation.meetup?.title ?? presence.label ?? ""}
                </p>
              </div>
            </>
          ) : (
            <Link
              href={`/profile/${conversation.other_user?.id ?? ""}`}
              className="flex items-center gap-3 flex-1 min-w-0 group"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={conversation.other_user?.avatar_url ?? undefined}
                  alt={conversation.other_user?.display_name ?? "User"}
                />
                <AvatarFallback>
                  {(conversation.other_user?.display_name ?? "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {conversation.other_user?.display_name ?? "Anonymous"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {conversation.meetup?.title ?? presence.label ?? ""}
                </p>
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ scrollPaddingBottom: scrollBottomPadding }}
      >
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4" style={{ paddingBottom: scrollBottomPadding }}>
          <motion.div
            className="rounded-3xl border border-border/60 bg-card/70 p-4"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0.01 } : quickTransition}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {otherUser?.travel_mode ? (
                  <Plane className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                )}
                <p className="text-sm font-medium truncate">
                  {otherUser?.travel_mode ? "Traveler" : "Local"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{otherUser?.mood ? `Mood: ${otherUser.mood}` : "Mood not shared"}</span>
            </div>

            {contextTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {contextTags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-secondary text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              {starter ? `Try asking about ${starter}.` : "Ask what they would like to do today."}
            </p>
          </motion.div>

          {isLoading && !isMock ? (
            <MessageSkeleton />
          ) : localMessages.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl border border-border/60 bg-card/50">
              <p className="text-foreground font-medium">Start the conversation</p>
              <p className="text-sm text-muted-foreground mt-1">
                {starter ? `Ask about ${starter} or suggest something nearby.` : "Ask what they would like to do today."}
              </p>
              {starter && (
                <button
                  onClick={handleUseStarter}
                  className="mt-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                >
                  Use starter
                </button>
              )}
            </div>
          ) : (
            localMessages.map((message) => {
              const isMe = message.sender_id === "me" || message.sender_id !== conversation.other_user?.id
              return (
                <motion.div
                  key={message.id}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.985 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0.01 } : quickTransition}
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
                </motion.div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className="fixed left-0 right-0 z-[60] bg-background border-t border-border/50 transition-[bottom] duration-150"
        style={{ bottom: composerBottom }}
      >
        <div className="max-w-lg mx-auto px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <Input
              id="message-composer-input"
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-secondary border-0"
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
