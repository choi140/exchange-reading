import { Suspense } from "react";
import { RoomReader } from "@/components/RoomReader";

// 책 리더 (혼자·함께 공통) /room/[방 id] (PRD #9)
export default function RoomPage(props: PageProps<"/room/[id]">) {
  return (
    <Suspense>
      <RoomLoader params={props.params} />
    </Suspense>
  );
}

async function RoomLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomReader roomId={id} />;
}
