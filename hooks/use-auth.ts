"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

const fetcher = async (): Promise<User | null> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR("auth", fetcher)

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    await mutate(null)
    window.location.href = "/auth/login"
  }

  return {
    user: data,
    isLoading,
    error,
    isAuthenticated: !!data,
    signOut,
    refresh: mutate,
  }
}
