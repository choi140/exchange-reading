import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";

// 2-9 책은 Supabase books 테이블에서 읽는다 (PRD #4.3, #9)
// 샘플 본문 원본은 src/data/books.json → scripts/gen-books-sql.mjs → supabase/03_books.sql

export type Book = {
  id: string;
  title: string;
  author: string;
  year: number | null;
  source: string;
  paragraphs: string[];
};

type Result<T> = { data: T; error: null } | { data: null; error: string };

const NO_ENV = "Supabase 연결 정보(환경변수)가 없어요.";

export async function listBooks(): Promise<Result<Omit<Book, "paragraphs">[]>> {
  const supabase = getServerSupabase();
  if (!supabase) return { data: null, error: NO_ENV };
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, year, source")
    .order("year", { ascending: true });
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getBook(id: string): Promise<Result<Book | null>> {
  const supabase = getServerSupabase();
  if (!supabase) return { data: null, error: NO_ENV };
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, year, source, paragraphs")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
