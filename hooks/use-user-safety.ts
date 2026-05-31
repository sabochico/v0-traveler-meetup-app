"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
const BLOCKED_USERS_KEY = "blocked-users"

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user.id
}

async function fetchBlockedUserIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)

  if (error) throw error
  return data?.map((block) => block.blocked_id) ?? []
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
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: userId, blocked_id: blockedUserId })

    if (error && error.code !== "23505") throw error
    await globalMutate(BLOCKED_USERS_KEY)
    await Promise.all([
      globalMutate("nearby-profiles"),
      globalMutate("meetups"),
      globalMutate("conversations"),
    ])
  }

  const unblockUser = async (blockedUserId: string) => {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedUserId)

    if (error) throw error
    await globalMutate(BLOCKED_USERS_KEY)
  }

  const reportUser = async (reportedUserId: string, reason: string, details?: string) => {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from("user_reports")
      .insert({
        reporter_id: userId,
        reported_id: reportedUserId,
        reason,
        details: details?.trim() || null,
      })

    if (error) throw error
  }

  return { blockUser, unblockUser, reportUser }
}
