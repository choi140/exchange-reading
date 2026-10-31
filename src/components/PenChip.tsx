// 내 펜 색 표시. 사람은 펜 색으로만 구분된다 (PRD #4.1)
export type PenColor = "black" | "blue" | "green" | "orange";

export const PEN: Record<PenColor, { label: string; className: string }> = {
  black: { label: "검정 펜", className: "text-pen-black" },
  blue: { label: "파란 펜", className: "text-pen-blue" },
  green: { label: "초록 펜", className: "text-pen-green" },
  orange: { label: "주황 펜", className: "text-pen-orange" },
};

export function PenChip({ color }: { color: PenColor }) {
  const pen = PEN[color];
  return (
    <span className={`inline-flex items-center gap-2 ${pen.className}`}>
      <svg aria-hidden="true" viewBox="0 0 28 8" className="h-2 w-7">
        <path
          d="M1 5 C 8 2, 16 7, 27 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-hand text-[22px] leading-none">
        나는 {pen.label}
      </span>
    </span>
  );
}
