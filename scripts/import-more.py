"""10-4 책장 넓히기: 원문 텍스트 파일을 문단 배열로 나눠 src/data/books.json에 더한다 (같은 id면 바꾼다).

사용법: python3 scripts/import-more.py 날개.txt 동백꽃.txt
- 한 줄 = 한 문단. 앞의 제목·저자 줄과 빈 줄은 뺀다.
- 복사 과정에서 생긴 것만 고친다: 사용자 영역 문자로 깨진 낫표(「」『』), 교과서판 낱말 풀이 표시(*).
- 저작권 보호기간(저자 사후 70년)이 끝난 작품만 넣는다. (PRD #7)
"""
import json
import sys

NALGAE, DONGBAEK = sys.argv[1:3]

# 「날개」 원본 파일의 사용자 영역 문자 → 낫표
PUA = {"\U000f0850": "「", "\U000f0851": "」", "\U000f0852": "『", "\U000f0853": "』"}


def paragraphs(path, skip_head_lines, fixes=()):
    text = open(path, encoding="utf-8").read().replace("\r\n", "\n").replace("﻿", "")
    for a, b in PUA.items():
        text = text.replace(a, b)
    for a, b in fixes:
        text = text.replace(a, b)
    lines = [l.strip() for l in text.split("\n")]
    body = [l for l in lines if l]
    return body[skip_head_lines:]


SOURCE = "원문 텍스트 (저작권 보호기간 만료: 저자 사후 70년 경과). 복사 과정에서 생긴 끊김·깨진 문자만 고침"
new_books = [
    {
        "id": "nalgae",
        "title": "날개",
        "author": "이상",
        "year": 1936,
        "source": SOURCE + " · 이상(1910–1937)",
        # 제목 "날 개", 저자 "이상(李霜)" 두 줄을 뺀다
        "paragraphs": paragraphs(NALGAE, 2),
    },
    {
        "id": "dongbaekkkot",
        "title": "동백꽃",
        "author": "김유정",
        "year": 1936,
        "source": SOURCE + " · 김유정(1908–1937)",
        # 제목 "동백꽃", 저자 "김 유 정" 두 줄을 빼고, 낱말 풀이 표시(*)를 지운다
        "paragraphs": paragraphs(DONGBAEK, 2, fixes=[("*", "")]),
    },
]

books = json.load(open("src/data/books.json", encoding="utf-8"))
ids = {b["id"] for b in new_books}
books = [b for b in books if b["id"] not in ids] + new_books
json.dump(books, open("src/data/books.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for b in new_books:
    print(b["title"], len(b["paragraphs"]), "문단", sum(len(p) for p in b["paragraphs"]), "자", "| 첫 문단:", b["paragraphs"][0][:30])
