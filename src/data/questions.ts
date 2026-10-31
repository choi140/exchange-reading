// 1-13 오늘의 질문 10개. 날짜(한국 시간 기준 일수)로 하나를 골라 순환한다 (PRD #4.2).

export const questions = [
  "오늘 가장 오래 바라본 것은 무엇이었나요?",
  "요즘 자꾸 생각나는 문장이 있나요?",
  "오늘 누군가에게 하지 못한 말이 있다면 여기에 적어 보세요.",
  "오늘 하루를 날씨로 말한다면 어떤 날씨였나요?",
  "최근에 작게라도 용기를 낸 순간이 있었나요?",
  "어릴 때 좋아했는데 지금은 잊고 지낸 것이 있나요?",
  "오늘 먹은 것 중 가장 기억에 남는 한 가지는?",
  "지금 이 순간 들리는 소리를 적어 보세요.",
  "요즘 나를 지치게 하는 것과 버티게 하는 것은 무엇인가요?",
  "내일의 나에게 한 줄 남긴다면?",
];

const DAY = 24 * 60 * 60 * 1000;
const KST_OFFSET = 9 * 60 * 60 * 1000;

export function questionFor(date: Date = new Date()) {
  const dayNumber = Math.floor((date.getTime() + KST_OFFSET) / DAY);
  return questions[dayNumber % questions.length];
}
