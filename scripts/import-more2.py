"""11-2 책장 넓히기: 원문 텍스트 파일을 문단 배열로 나눠 src/data/books.json에 더한다 (같은 id면 바꾼다).

사용법: python scripts/import-more2.py "B사감과 러브레터.txt" 감자.txt scripts/samnyong-modern.txt
- 한 줄 = 한 문단. 앞의 제목 줄과 빈 줄은 뺀다.
- 복사 과정에서 생긴 것만 고친다: 장식 기호(🙝🙟), 겹쳐 들어간 구절.
- 「벙어리 삼룡이」는 1925년 표기(옛 글자, 붙여쓰기)를 읽기 어려워 사용자 요청으로 지금 맞춤법과
  띄어쓰기로 다듬은 scripts/samnyong-modern.txt를 쓴다. 문단과 내용은 원문 그대로다.
- 저작권 보호기간(저자 사후 70년)이 끝난 작품만 넣는다. (PRD #7)
"""
import json
import sys

BSAGAM, GAMJA, SAMNYONG = sys.argv[1:4]


def paragraphs(path, fixes=()):
    text = open(path, encoding="utf-8").read().replace("\r\n", "\n").replace("﻿", "")
    for a, b in fixes:
        if a not in text:
            raise SystemExit(f"고칠 곳을 못 찾음: {a}")
        text = text.replace(a, b)
    lines = [l.strip() for l in text.split("\n")]
    # 맨 앞 제목 줄을 뺀다
    return [l for l in lines if l][1:]


SOURCE = "원문 텍스트 (저작권 보호기간 만료: 저자 사후 70년 경과). 복사 과정에서 생긴 끊김·깨진 문자만 고침"
new_books = [
    {
        "id": "bsagam",
        "title": "B사감과 러브레터",
        "author": "현진건",
        "year": 1925,
        "source": SOURCE + " · 현진건(1900–1943)",
        "paragraphs": paragraphs(BSAGAM, fixes=[("🙝🙟", "")]),
    },
    {
        "id": "gamja",
        "title": "감자",
        "author": "김동인",
        "year": 1925,
        "source": SOURCE + " · 김동인(1900–1951)",
        "paragraphs": paragraphs(GAMJA, fixes=[("그들은 이 칠성문 밖에서는 그들은 이 칠성문 밖에서도", "그들은 이 칠성문 밖에서도")]),
    },
    {
        "id": "samnyong",
        "title": "벙어리 삼룡이",
        "author": "나도향",
        "year": 1925,
        "source": "원문 텍스트 (저작권 보호기간 만료: 저자 사후 70년 경과). 1925년 표기를 지금 맞춤법과 띄어쓰기로 다듬음 · 나도향(1902–1926)",
        "paragraphs": paragraphs(SAMNYONG),
    },
]

books = json.load(open("src/data/books.json", encoding="utf-8"))
ids = {b["id"] for b in new_books}
books = [b for b in books if b["id"] not in ids] + new_books
with open("src/data/books.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(books, f, ensure_ascii=False, indent=2)
for b in new_books:
    print(b["title"], len(b["paragraphs"]), "문단", sum(len(p) for p in b["paragraphs"]), "자", "| 첫 문단:", b["paragraphs"][0][:30])
    odd = sorted({c for p in b["paragraphs"] for c in p if 0x1100 <= ord(c) <= 0x11ff or 0xe000 <= ord(c) <= 0xf8ff or ord(c) > 0xffff})
    print("  남은 깨진 글자:", [hex(ord(c)) for c in odd])
