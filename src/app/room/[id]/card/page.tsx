import { Suspense } from "react";
import { MemoryCardPage } from "@/components/MemoryCard";

// 10-3 다 읽은 뒤 기념 카드 /room/[방 id]/card
export default function CardPage(props: PageProps<"/room/[id]/card">) {
  return (
    <Suspense>
      <CardLoader params={props.params} />
    </Suspense>
  );
}

async function CardLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemoryCardPage roomId={id} />;
}
