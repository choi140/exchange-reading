-- 23단계 (15_marker 다음에 실행. 여러 번 실행해도 된다)
-- 23-1 책 끝 출처에서 "복사 과정에서 ... 고침" 문구를 뺀다
update public.books
set source = replace(
  replace(source, '. 복사 과정에서 생긴 끊김·깨진 문자만 고침', ''),
  '. 복사 과정에서 생긴 줄바꿈·띄어쓰기 끊김만 고침',
  ''
)
where source like '%복사 과정에서%';
