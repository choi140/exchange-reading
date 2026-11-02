"""5-11 원문 텍스트 파일 3개를 문단 배열로 나눠 src/data/books.json을 교체한다.

사용법: python3 scripts/import-originals.py 운수.txt 봄봄.txt 메밀꽃.txt
- 한 줄 = 한 문단. 제목·저자 줄과 빈 줄, 끝의 "끝."은 뺀다.
- PDF 등에서 복사하며 생긴 끊김만 고친다(단어 중간 공백, 문단 중간 줄바꿈). 표기·맞춤법은 원문 그대로 둔다.
"""
import json
import re
import sys

UNSU, BOMBOM, MEMIL = sys.argv[1:4]


def lines_of(path):
    text = open(path, encoding="utf-8").read().replace("\r\n", "\n").replace("﻿", "")
    return [l.strip() for l in text.split("\n")]


# 메밀꽃 필 무렵: 원래 줄바꿈 자리에 남은 공백 여러 칸. 단어 중간에서 끊긴 곳은 붙이고, 나머지는 한 칸으로.
MEMIL_JOIN = {
    ("걱", "정"), ("고", "작해야"), ("그렇다", "군"), ("꼴", "이"), ("나", "귀"), ("누그러", "지기도"),
    ("대화장에", "서나"), ("마지", "막"), ("마찬가지", "나"), ("물", "을"), ("밤", "이었어"), ("아니었", "네"),
    ("아버", "지"), ("아이", "를"), ("어른보다", "도"), ("여", "간이래야지"), ("의", "부라고"), ("이", "를"),
    ("있다", "네"), ("정", "을"), ("지내기", "도"), ("평", "생인들"), ("피붙이라", "고는"),
}


def fix_memil(line):
    def repl(m):
        a, b = m.group(1), m.group(2)
        a_word = re.sub(r"^.*?([가-힣]+)$", r"\1", a)
        b_word = re.match(r"[가-힣]*", b).group(0)
        for ja, jb in MEMIL_JOIN:
            if a_word.endswith(ja) and b_word.startswith(jb):
                return a + b
        return a + " " + b

    return re.sub(r"(\S+) {2,}(\S+)", repl, line)


# 봄·봄: 단어 중간에 끼어든 공백(원래 줄바꿈 자리)과 붙어 버린 띄어쓰기
BOMBOM_FIX = [
    ("했 다.", "했다."), ("일 을 좀더", "일을 좀더"), ("그 리고 난", "그리고 난"), ("새고 개", "새고개"),
    ("귓 배기", "귓배기"), ("빙모님은점순이보다도", "빙모님은 점순이보다도"),
    ("안한다든가집으로", "안한다든가 집으로"), ("가겠 다 했다", "가겠다 했다"), ("법 률에", "법률에"),
    ("그렇 지만", "그렇지만"), ("남의 농 사를", "남의 농사를"), ("어른이 아니 다.", "어른이 아니다."),
    ("아 무도", "아무도"), ("가여 웁다", "가여웁다"), ("뒤지게를", "뒤 지게를"), ("이자식아징역간다", "이자식아 징역간다"),
    ("궂 어서", "궂어서"), ("넌 해 라", "넌 해라"), ("일어 나서", "일어나서"), ("점순 이는", "점순이는"),
]


def fix_bombom(lines):
    out = []
    for l in lines:
        for a, b in BOMBOM_FIX:
            l = l.replace(a, b)
        out.append(l)
    # 문단 중간에서 끊긴 줄 이어 붙이기: "우물길에서…" 문단(3줄), "…뛰어 나왔다. 나의" + "생각에…"
    merged, i = [], 0
    while i < len(out):
        l = out[i]
        if l.startswith("우물길에서 언제나"):
            while not l.endswith("요모양이다."):
                i += 1
                l = l + " " + out[i]
        elif l.endswith(" 나의"):
            i += 1
            l = l + " " + out[i]
        merged.append(l)
        i += 1
    return merged


UNSU_FIX = [
    ("(東光學校))", "(東光學校)"), ("들을 수 없다..", "들을 수 없다."), ("돌아를간담", "돌아를 간담"),
    ("귀찮게굴어", "귀찮게 굴어"), ("밥을죽이지", "밥을 죽이지"), ("젖 빠는 소리가 날 뿐이다.만일", "젖 빠는 소리가 날 뿐이다. 만일"),
]


def paragraphs(lines, skip_head):
    body = [l for l in lines[skip_head:] if l]
    if body and body[-1].endswith("끝."):
        body[-1] = body[-1][: -len("끝.")].rstrip()
    return [re.sub(r" {2,}", " ", p) for p in body if p]


unsu = lines_of(UNSU)
unsu = [l for l in unsu]
for i, l in enumerate(unsu):
    for a, b in UNSU_FIX:
        l = l.replace(a, b)
    unsu[i] = l
unsu_p = paragraphs(unsu[3:], 0)  # 제목, 빈 줄, 저자

bombom_p = paragraphs(fix_bombom(lines_of(BOMBOM)[3:]), 0)  # 제목, 빈 줄, 저자

memil = [fix_memil(l) for l in lines_of(MEMIL)[2:]]  # 제목, 저자
memil_p = paragraphs(memil, 0)

SOURCE = "원문 텍스트 (저작권 보호기간 만료: 저자 사후 70년 경과)"
books = [
    {"id": "unsu-joeun-nal", "title": "운수 좋은 날", "author": "현진건", "year": 1924,
     "source": SOURCE + " · 현진건(1900–1943)", "paragraphs": unsu_p},
    {"id": "bom-bom", "title": "봄·봄", "author": "김유정", "year": 1935,
     "source": SOURCE + " · 김유정(1908–1937)", "paragraphs": bombom_p},
    {"id": "memilkkot", "title": "메밀꽃 필 무렵", "author": "이효석", "year": 1936,
     "source": SOURCE + " · 이효석(1907–1942)", "paragraphs": memil_p},
]
json.dump(books, open("src/data/books.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for b in books:
    print(b["title"], len(b["paragraphs"]), "문단", sum(len(p) for p in b["paragraphs"]), "자")
