import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseEnv } from "./env";

// 서버용 클라이언트: 로그인과 상관없는 공개 데이터(책)만 읽는다.
// 사용자별 데이터(방·메모·일기)는 브라우저에서 익명 세션으로 읽는다.
export function getServerSupabase() {
  if (!hasSupabaseEnv) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
