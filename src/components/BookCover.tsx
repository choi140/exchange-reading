import { COVERS } from "@/data/covers";

// 14-4 책 표지: 이미지가 있으면 이미지, 없으면 제목과 저자로 만든 글자 표지 (펜 색은 사람을 뜻하므로 쓰지 않는다)
export function BookCover({ id, title, author }: { id: string; title: string; author: string }) {
  const src = COVERS[id];
  return (
    <div className="aspect-[2/3] w-full overflow-hidden rounded-sm border border-rule bg-page [container-type:inline-size]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- public 폴더의 표지를 그대로 보여 준다
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div aria-hidden className="flex h-full flex-col justify-between border-l-[4cqw] border-ink/80 p-[9cqw]">
          <p className="font-serif text-[clamp(13px,12cqw,34px)] leading-snug text-ink">{title}</p>
          <p className="text-[clamp(11px,6.5cqw,17px)] text-pencil">{author}</p>
        </div>
      )}
    </div>
  );
}
