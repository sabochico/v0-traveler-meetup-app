"use client"

import { useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const ONLINE_WINDOW_MS = 2 * 60 * 1000

const isRecentlySeen = (lastSeenAt?: string | null) => {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS
}

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
    .select("*")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false })

  if (convError || !conversations) return []

  const fullConversations = await Promise.all(conversations.map(async (conv) => {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conv.id)
      .neq("user_id", user.id)
      .single()

    if (!participants) return null

    const [{ data: otherUser }, { data: lastMessages }, { count: unreadCount }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, is_online, last_seen_at, mood, travel_mode, current_city, current_country, location, interests, languages")
          .eq("id", participants.user_id)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", user.id),
      ])

    const lastSeenAt = otherUser?.last_seen_at ?? null

    return {
      id: conv.id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      other_user: {
        id: participants.user_id,
        display_name: otherUser?.display_name ?? null,
        avatar_url: otherUser?.avatar_url ?? null,
        is_online: Boolean(otherUser?.is_online) || isRecentlySeen(lastSeenAt),
        last_seen_at: lastSeenAt,
        mood: otherUser?.mood ?? null,
        travel_mode: otherUser?.travel_mode ?? false,
        current_city: otherUser?.current_city ?? null,
        current_country: otherUser?.current_country ?? null,
        location: otherUser?.location ?? null,
        interests: otherUser?.interests ?? [],
        languages: otherUser?.languages ?? [],
      },
      last_message: lastMessages?.[0] ?? null,
      unread_count: unreadCount ?? 0,
    }
  }))

  return fullConversations.filter((conversation): conversation is Conversation => Boolean(conversation))
}

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR("conversations", conversationsFetcher)

  useEffect(() => {
    return subscribeToConversationMessages(() => {
      void mutate()
    })
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
            async (current) => {
              if (current?.some((m) => m.id === newMessage.id)) return current
              return messagesFetcher(conversationId)
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

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

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
