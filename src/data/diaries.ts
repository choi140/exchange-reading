// 1단계용 예시 일기장. 3단계에서 Supabase diaries·diary_entries로 바뀐다.

export type DiaryEntry = {
  id: string;
  prompt: string;
  body: string;
  createdAt: string; // ISO
};

export type Diary = {
  id: string;
  title: string;
  mode: "solo" | "exchange";
  entries: DiaryEntry[];
};

export const sampleDiaries: Diary[] = [
  {
    id: "sample",
    title: "혼자 쓰는 일기",
    mode: "solo",
    entries: [
      {
        id: "e2",
        prompt: "지금 이 순간 들리는 소리를 적어 보세요.",
        body: "냉장고가 웅 하고 돌아가는 소리, 윗집 누군가 의자를 끄는 소리. 조용한 줄 알았는데 귀를 기울이니 방이 꽤 시끄럽다.",
        createdAt: "2026-10-31T23:10:00+09:00",
      },
      {
        id: "e1",
        prompt: "요즘 자꾸 생각나는 문장이 있나요?",
        body: "\"소금을 뿌린 듯이 흐뭇한 달빛.\" 흐뭇하다는 말을 달빛에 붙일 수 있다는 게 계속 신기하다.",
        createdAt: "2026-10-30T22:40:00+09:00",
      },
    ],
  },
];

export function getDiary(id: string) {
  return sampleDiaries.find((d) => d.id === id);
}
