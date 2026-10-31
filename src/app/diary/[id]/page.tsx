import { Suspense } from "react";
import { DiaryView } from "@/components/DiaryView";

// 일기장 (혼자·교환 공통) /diary/[일기장 id] (PRD #9)
export default function DiaryPage(props: PageProps<"/diary/[id]">) {
  return (
    <Suspense>
      <DiaryLoader params={props.params} />
    </Suspense>
  );
}

async function DiaryLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiaryView diaryId={id} />;
}
