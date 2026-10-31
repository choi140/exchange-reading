// 로고: "낯선 밑줄" + 파란 펜으로 그은 듯한 손그림 밑줄 (디자인에서 유일하게 과감한 요소)
export function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const big = size === "lg";
  return (
    <span className="relative inline-block">
      <span
        className={`font-serif font-bold tracking-tight text-ink ${
          big ? "text-[44px] leading-none" : "text-[22px] leading-none"
        }`}
      >
        낯선 밑줄
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 200 18"
        preserveAspectRatio="none"
        className={`absolute left-[-4%] w-[108%] text-pen-blue ${
          big ? "-bottom-3 h-4" : "-bottom-2 h-2.5"
        }`}
      >
        <path
          d="M3 11 C 40 5, 70 14, 104 8 S 168 4, 197 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M30 14 C 80 10, 130 15, 182 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </span>
  );
}
