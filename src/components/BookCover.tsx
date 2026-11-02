import { COVERS } from "@/data/covers";

// 14-4/17-3 책 표지: 이미지가 있으면 이미지, 없으면 입자감 있는 색 표지에 제목과 저자
const COLORS = [
  { bg: "bg-spine-orange", text: "text-white" },
  { bg: "bg-spine-navy", text: "text-white" },
  { bg: "bg-spine-mustard", text: "text-[#191919]" },
];

// 책 id로 색을 정해서 어디서 봐도 같은 책은 같은 색이다
export function bookColor(id: string) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return COLORS[sum % COLORS.length];
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`flex items-center justify-center rounded-full bg-white text-[#191919] ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]">
        <path d="M12 1c1 7 4 10 11 11-7 1-10 4-11 11-1-7-4-10-11-11 7-1 10-4 11-11z" fill="currentColor" />
      </svg>
    </span>
  );
}

export function BookCover({ id, title, author }: { id: string; title: string; author: string }) {
  const src = COVERS[id];
  const color = bookColor(id);
  return (
    <div className="pb-1.5 pr-1.5">
      <div className="aspect-[2/3] w-full rounded-[3px] shadow-[6px_6px_0_#000] [container-type:inline-size]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- public 폴더의 표지를 그대로 보여 준다
          <img src={src} alt="" className="h-full w-full rounded-[3px] object-cover" />
        ) : (
          <div aria-hidden className={`grain flex h-full flex-col justify-between rounded-[3px] p-[9cqw] ${color.bg} ${color.text}`}>
            <div className="flex justify-end">
              <Star className="h-[20cqw] w-[20cqw]" />
            </div>
            <div>
              <p className="font-display text-[clamp(12px,15cqw,40px)] leading-[1.15]">{title}</p>
              <p className="mt-[3cqw] text-[clamp(9px,7cqw,18px)] font-medium">{author}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
