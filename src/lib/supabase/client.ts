"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseEnv } from "./env";

// 브라우저용 클라이언트. 익명 계정 세션을 이 브라우저(localStorage)에 기억한다 (PRD #4.4)
let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase() {
  if (!hasSupabaseEnv) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}
