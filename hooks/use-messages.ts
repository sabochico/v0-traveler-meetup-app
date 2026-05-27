"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export interface Conversation {
  id: string
  created_at: string
  updated_at: string
  other_user: {
    id: string
    display_name: string | null
    avatar_url: string | null
    is_online: boolean
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

  // Get all conversations the user is part of
  const { data: participations, error: partError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)

  if (partError || !participations?.length) return []

  const conversationIds = participations.map(p => p.conversation_id)

  // Get conversations with other participants
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false })

  if (convError || !conversations) return []

  // Build full conversation objects
  const fullConversations: Conversation[] = []

  for (const conv of conversations) {
    // Get other participant
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conv.id)
      .neq("user_id", user.id)
      .single()

    if (!participants) continue

    // Get other user profile
    const { data: otherUser } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, is_online")
      .eq("id", participants.user_id)
      .single()

    if (!otherUser) continue

    // Get last message
    const { data: lastMessages } = await supabase
      .from("messages")
      .select("content, created_at, sender_id")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1)

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .eq("is_read", false)
      .neq("sender_id", user.id)

    fullConversations.push({
      id: conv.id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      other_user: otherUser,
      last_message: lastMessages?.[0] ?? null,
      unread_count: unreadCount ?? 0,
    })
  }

  return fullConversations
}

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR("conversations", conversationsFetcher)

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
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `messages-${conversationId}` : null,
    () => conversationId ? messagesFetcher(conversationId) : Promise.resolve([])
  )

  return {
    messages: data ?? EMPTY_MESSAGES,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useCreateConversation() {
  const { refresh: refreshConversations } = useConversations()

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

    await refreshConversations()
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

    // Update conversation updated_at
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
