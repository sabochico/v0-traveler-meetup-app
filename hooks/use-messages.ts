"use client"

import { useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getPresenceStatus } from "@/lib/presence"
import { assertTextIsSafe, cleanUserText } from "@/lib/text-moderation"

const supabase = createClient()

/** One shared channel — Supabase rejects .on() after .subscribe() on the same topic. */
let conversationsMessagesChannel: RealtimeChannel | null = null
const conversationsMessagesListeners = new Set<() => void>()

function subscribeToConversationMessages(onUpdate: () => void): () => void {
  conversationsMessagesListeners.add(onUpdate)

  if (!conversationsMessagesChannel) {
    conversationsMessagesChannel = supabase
      .channel("conversations:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          conversationsMessagesListeners.forEach((listener) => listener())
        }
      )
      .subscribe()
  }

  return () => {
    conversationsMessagesListeners.delete(onUpdate)
    if (conversationsMessagesListeners.size === 0 && conversationsMessagesChannel) {
      void supabase.removeChannel(conversationsMessagesChannel)
      conversationsMessagesChannel = null
    }
  }
}

export interface Conversation {
  id: string
  created_at: string
  updated_at: string
  other_user: {
    id: string
    display_name: string | null
    avatar_url: string | null
    is_online: boolean
    last_active_at: string | null
    last_seen_at: string | null
    mood: string | null
    travel_mode: boolean
    current_city: string | null
    current_country: string | null
    location: string | null
    interests: string[]
    languages: string[]
  }
  last_message: {
    content: string
    created_at: string
    sender_id: string
  } | null
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

const EMPTY_CONVERSATIONS: Conversation[] = []
const EMPTY_MESSAGES: Message[] = []
const SWR_OPTIONS = { keepPreviousData: true }

const conversationsFetcher = async (): Promise<Conversation[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: participations, error: partError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)

  if (partError || !participations?.length) return []

  const conversationIds = participations.map(p => p.conversation_id)

  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false })

  if (convError || !conversations) return []

  const [
    { data: otherParticipants },
    { data: recentMessages },
    { data: unreadMessages },
  ] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds)
      .neq("user_id", user.id),
    supabase
      .from("messages")
      .select("conversation_id, content, created_at, sender_id")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", conversationIds)
      .eq("is_read", false)
      .neq("sender_id", user.id),
  ])

  const otherParticipantByConversation = new Map(
    (otherParticipants ?? []).map((participant) => [participant.conversation_id, participant.user_id])
  )
  const otherUserIds = Array.from(new Set((otherParticipants ?? []).map((participant) => participant.user_id)))
  const { data: otherUsers } = otherUserIds.length
    ? await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, is_online, last_active_at, last_seen_at, mood, travel_mode, current_city, current_country, location, interests, languages")
      .in("id", otherUserIds)
    : { data: [] }
  const profileById = new Map((otherUsers ?? []).map((profile) => [profile.id, profile]))
  const lastMessageByConversation = new Map<string, NonNullable<typeof recentMessages>[number]>()
  for (const message of recentMessages ?? []) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message)
    }
  }
  const unreadCountByConversation = new Map<string, number>()
  for (const message of unreadMessages ?? []) {
    unreadCountByConversation.set(
      message.conversation_id,
      (unreadCountByConversation.get(message.conversation_id) ?? 0) + 1
    )
  }

  const fullConversations = conversations.map((conv) => {
    const otherUserId = otherParticipantByConversation.get(conv.id)
    if (!otherUserId) return null

    const otherUser = profileById.get(otherUserId)
    const lastSeenAt = otherUser?.last_seen_at ?? null
    const presence = getPresenceStatus({
      last_active_at: otherUser?.last_active_at ?? null,
      last_seen_at: lastSeenAt,
    })

    return {
      id: conv.id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      other_user: {
        id: otherUserId,
        display_name: otherUser?.display_name ?? null,
        avatar_url: otherUser?.avatar_url ?? null,
        is_online: presence.state === "online",
        last_active_at: otherUser?.last_active_at ?? null,
        last_seen_at: lastSeenAt,
        mood: otherUser?.mood ?? null,
        travel_mode: otherUser?.travel_mode ?? false,
        current_city: otherUser?.current_city ?? null,
        current_country: otherUser?.current_country ?? null,
        location: otherUser?.location ?? null,
        interests: otherUser?.interests ?? [],
        languages: otherUser?.languages ?? [],
      },
      last_message: lastMessageByConversation.get(conv.id) ?? null,
      unread_count: unreadCountByConversation.get(conv.id) ?? 0,
    }
  })

  return fullConversations.filter((conversation): conversation is Conversation => Boolean(conversation))
}

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR("conversations", conversationsFetcher, SWR_OPTIONS)

  useEffect(() => {
    const unsubscribeMessages = subscribeToConversationMessages(() => {
      void mutate()
    })

    const profileChannel = supabase
      .channel("conversations:profiles")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          void mutate()
        }
      )
      .subscribe()

    return () => {
      unsubscribeMessages()
      void supabase.removeChannel(profileChannel)
    }
  }, [mutate])

  return {
    conversations: data ?? EMPTY_CONVERSATIONS,
    isLoading,
    error,
    refresh: mutate,
  }
}

const messagesFetcher = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useMessages(conversationId: string | null) {
  const swrKey = conversationId ? `messages-${conversationId}` : null
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => conversationId ? messagesFetcher(conversationId) : Promise.resolve([])
  )

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          void mutate(
            (current) => {
              if (current?.some((m) => m.id === newMessage.id)) return current
              return [...(current ?? []), newMessage]
            },
            { revalidate: false }
          )
          void globalMutate("conversations")
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, mutate])

  return {
    messages: data ?? EMPTY_MESSAGES,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useCreateConversation() {
  const startConversation = async (otherUserId: string): Promise<{ conversationId: string; isNew: boolean }> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error("Not authenticated")

    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ otherUserId }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to create conversation")
    }

    await globalMutate("conversations")
    return { conversationId: data.conversationId, isNew: data.isNew }
  }

  return { startConversation }
}

export function useSendMessage() {
  const sendMessage = async (conversationId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    const safeContent = cleanUserText(content)
    assertTextIsSafe(safeContent, "message")

    console.debug("[Drift messages] insert start", {
      conversationId,
      userId: user.id,
      contentLength: safeContent.length,
    })

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: safeContent,
      })
      .select()
      .single()

    if (error) {
      console.error("[Drift messages] insert failed", {
        conversationId,
        userId: user.id,
        error,
      })
      throw error
    }

    console.debug("[Drift messages] insert success", {
      conversationId,
      userId: user.id,
      messageId: data.id,
    })

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    void globalMutate("conversations")

    return data
  }

  const markAsRead = async (conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
  }

  return { sendMessage, markAsRead }
}
