// src/data/books.json → supabase/03_books.sql 생성 (2-5)
// 사용법: node scripts/gen-books-sql.mjs
import { readFileSync, writeFileSync } from "node:fs";

const books = JSON.parse(readFileSync("src/data/books.json", "utf8"));
const q = (s) => "'" + String(s).replaceAll("'", "''") + "'";

const rows = books.map((b) => {
  const paras = b.paragraphs.map((p) => "    " + q(p)).join(",\n");
  return `  (${q(b.id)}, ${q(b.title)}, ${q(b.author)}, ${b.year}, ${q(b.source)}, array[\n${paras}\n  ])`;
});

const sql = `-- 2-5 샘플 책 3편을 books에 넣는다 (PRD #7)
-- 이 파일은 scripts/gen-books-sql.mjs가 src/data/books.json에서 만든다. 직접 고치지 말 것.
-- 같은 id가 있으면 내용을 덮어쓴다.

insert into public.books (id, title, author, year, source, paragraphs) values
${rows.join(",\n")}
on conflict (id) do update set
  title = excluded.title,
  author = excluded.author,
  year = excluded.year,
  source = excluded.source,
  paragraphs = excluded.paragraphs;
`;

writeFileSync("supabase/03_books.sql", sql);
console.log(`supabase/03_books.sql: ${books.length}권`);
