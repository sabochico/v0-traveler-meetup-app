"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { clearCachedProfile } from "@/lib/profile-cache"

const fetcher = async (): Promise<User | null> => {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.user ?? null
}

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR("auth", fetcher)

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) clearCachedProfile()
      mutate(session?.user ?? null, { revalidate: false })
    })

    return () => subscription.unsubscribe()
  }, [mutate])

  const signOut = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from("push_tokens" as never).delete().eq("user_id", user.id)
    }

    await supabase.auth.signOut()
    clearCachedProfile()
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
