"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { assertFieldsAreSafe, cleanUserText } from "@/lib/text-moderation"

const BLOCKED_USERS_KEY = "blocked-users"

type BlockedUserRow = { blocked_id: string }
type SupabaseClient = ReturnType<typeof createClient>

async function getCurrentUserId(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user.id
}

async function fetchBlockedUserIds(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)

  if (error) throw error
  return ((data ?? []) as BlockedUserRow[]).map((block) => block.blocked_id)
}

export function useBlockedUsers() {
  const { data, error, isLoading, mutate } = useSWR(BLOCKED_USERS_KEY, fetchBlockedUserIds, {
    keepPreviousData: true,
  })

  return {
    blockedUserIds: data ?? [],
    blockedUserIdSet: new Set(data ?? []),
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useUserSafety() {
  const blockUser = async (blockedUserId: string) => {
    const supabase = createClient()
    const userId = await getCurrentUserId(supabase)
    const { error } = await supabase
      .from("user_blocks")
      .insert([{ blocker_id: userId, blocked_id: blockedUserId }] as never[])

    if (error && error.code !== "23505") throw error
    await globalMutate(BLOCKED_USERS_KEY)
    await Promise.all([
      globalMutate("nearby-profiles"),
      globalMutate("meetups"),
      globalMutate("conversations"),
    ])
  }

  const unblockUser = async (blockedUserId: string) => {
    const supabase = createClient()
    const userId = await getCurrentUserId(supabase)
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedUserId)

    if (error) throw error
    await globalMutate(BLOCKED_USERS_KEY)
  }

  const reportUser = async (reportedUserId: string, reason: string, details?: string) => {
    const supabase = createClient()
    const userId = await getCurrentUserId(supabase)
    assertFieldsAreSafe([reason, details], "report")
    const { error } = await supabase
      .from("user_reports")
      .insert([{
        reporter_id: userId,
        reported_id: reportedUserId,
        reason: cleanUserText(reason),
        details: details ? cleanUserText(details) || null : null,
      }] as never[])

    if (error) throw error
  }

  return { blockUser, unblockUser, reportUser }
}
