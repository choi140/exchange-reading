"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "../PenChip";

// 문단 메모 패널 (RoomReader에서 분리)
// 3-3 메모 입력창(300자) · 3-4 저장 · 3-5 목록 · 4-5·4-6 블라인드 · 4-7 답글 · 7-5 새 메모 표시

export const NOTE_MAX = 300;
export const NOTE_COLUMNS = "id, user_id, paragraph_index, parent_id, body, created_at";

export type Note = {
  id: string;
  user_id: string;
  paragraph_index: number;
  parent_id: string | null;
  body: string;
  created_at: string;
};

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
});

export async function insertNote(fields: {
  room_id: string;
  paragraph_index: number;
  parent_id?: string;
  body: string;
}): Promise<{ note: Note | null; error: string | null }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { note: null, error: "Supabase 연결 정보가 없어요." };
  const { data, error } = await supabase.from("notes").insert(fields).select(NOTE_COLUMNS).single();
  if (error || !data) return { note: null, error: error?.message ?? "응답 없음" };
  return { note: data as Note, error: null };
}

// 3-3 메모 입력창(300자) + 3-4 저장 + 3-5 메모 목록 + 4-5·4-6 블라인드 + 4-7 답글
export function NotePanel({
  roomId,
  paragraphIndex,
  together,
  blind,
  tops,
  repliesByParent,
  penOf,
  myPen,
  isNew,
  underlines,
  onAdded,
  onUnlock,
  onClose,
}: {
  roomId: string;
  paragraphIndex: number;
  together: boolean;
  blind: boolean;
  tops: Note[];
  repliesByParent: Map<string, Note[]>;
  penOf: (userId: string) => PenColor;
  myPen: PenColor;
  isNew: (n: Note) => boolean;
  underlines?: React.ReactNode;
  onAdded: (n: Note) => void;
  onUnlock: () => Promise<string | null | undefined>;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    setError(null);
    const res = await insertNote({ room_id: roomId, paragraph_index: paragraphIndex, body: text });
    setSaving(false);
    if (res.error || !res.note) {
      setError(`메모를 남기지 못했어요. 다시 눌러 주세요. (${res.error})`);
      return;
    }
    onAdded(res.note);
    setBody("");
  }

  return (
    <div className="mb-4 mr-3 border-t border-dashed border-rule pt-4">
      {underlines}
      {blind ? (
        <div className="rounded-sm border border-dashed border-pencil/60 px-4 py-4">
          <p className="font-serif text-[17px] text-ink">숨겨진 메모 {tops.length}개</p>
          <p className="mt-1 text-[14px] leading-relaxed text-pencil">
            내 생각을 먼저 남기면 다른 사람의 메모가 열려요. 바로 보고 싶다면 그냥 볼 수도 있어요.
          </p>
          <button
            type="button"
            disabled={unlocking}
            onClick={async () => {
              setUnlocking(true);
              const err = await onUnlock();
              setUnlocking(false);
              if (err) setError(err);
            }}
            className="mt-3 h-10 rounded-full border border-ink px-4 text-[14px] text-ink disabled:opacity-60"
          >
            {unlocking ? "여는 중…" : "그냥 보기"}
          </button>
        </div>
      ) : (
        tops.length > 0 && (
          <ul className="space-y-5">
            {tops.map((n) => (
              <li key={n.id}>
                <NoteBody note={n} penOf={penOf} isNew={isNew(n)} />
                {together && (
                  <div className="ml-3 mt-2 border-l border-rule pl-3">
                    {(repliesByParent.get(n.id) ?? []).map((r) => (
                      <div key={r.id} className="mb-2">
                        <NoteBody note={r} penOf={penOf} small isNew={isNew(r)} />
                      </div>
                    ))}
                    {replyTo === n.id ? (
                      <ReplyForm
                        roomId={roomId}
                        paragraphIndex={paragraphIndex}
                        parent={n}
                        myPen={myPen}
                        onAdded={(r) => {
                          onAdded(r);
                          setReplyTo(null);
                        }}
                        onCancel={() => setReplyTo(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReplyTo(n.id)}
                        className="h-8 text-[13px] text-pencil underline underline-offset-4"
                      >
                        답글 달기
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      )}

      <form onSubmit={save} className={tops.length > 0 ? "mt-5" : ""}>
        <label htmlFor={`note-${paragraphIndex}`} className="sr-only">
          {paragraphIndex + 1}번째 문단에 메모
        </label>
        <textarea
          id={`note-${paragraphIndex}`}
          autoFocus={!blind}
          value={body}
          maxLength={NOTE_MAX}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={blind ? "내 메모를 남기면 숨겨진 메모가 열려요." : "이 문단에서 떠오른 생각을 적어 보세요."}
          className={`block w-full resize-y rounded-sm border border-rule bg-page px-3 py-2 font-hand text-[22px] leading-[1.3] placeholder:font-sans placeholder:text-[15px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[myPen].className}`}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[13px] tabular-nums text-pencil">
            {body.length} / {NOTE_MAX}자
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-10 px-3 text-[14px] text-pencil">
              닫기
            </button>
            <button
              type="submit"
              disabled={saving || body.trim().length === 0}
              className="h-10 rounded-full bg-ink px-5 text-[14px] text-page disabled:opacity-40 active:translate-y-px"
            >
              {saving ? "남기는 중…" : "메모 남기기"}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-[14px] text-pen-orange">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

function NoteBody({
  note,
  penOf,
  small,
  isNew,
}: {
  note: Note;
  penOf: (userId: string) => PenColor;
  small?: boolean;
  isNew?: boolean;
}) {
  const pen = PEN[penOf(note.user_id)];
  return (
    <>
      <p
        className={`whitespace-pre-wrap font-hand ${small ? "text-[21px]" : "text-[24px]"} leading-[1.25] ${pen.className}`}
      >
        {note.body}
      </p>
      <p className="mt-1 text-[12px] text-pencil">
        {pen.label}, {timeFormat.format(new Date(note.created_at))}
        {isNew && (
          <span className="ml-2 rounded-full border border-ink px-1.5 py-px text-[11px] text-ink">새 메모</span>
        )}
      </p>
    </>
  );
}

// 4-7 메모 아래 한 단계 답글
function ReplyForm({
  roomId,
  paragraphIndex,
  parent,
  myPen,
  onAdded,
  onCancel,
}: {
  roomId: string;
  paragraphIndex: number;
  parent: Note;
  myPen: PenColor;
  onAdded: (n: Note) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    setError(null);
    const res = await insertNote({
      room_id: roomId,
      paragraph_index: paragraphIndex,
      parent_id: parent.id,
      body: text,
    });
    setSaving(false);
    if (res.error || !res.note) {
      setError(`답글을 남기지 못했어요. 다시 눌러 주세요. (${res.error})`);
      return;
    }
    onAdded(res.note);
  }

  return (
    <form onSubmit={save} className="mt-1">
      <label htmlFor={`reply-${parent.id}`} className="sr-only">
        답글
      </label>
      <textarea
        id={`reply-${parent.id}`}
        autoFocus
        value={body}
        maxLength={NOTE_MAX}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="답글을 적어 보세요."
        className={`block w-full resize-y rounded-sm border border-rule bg-page px-3 py-2 font-hand text-[21px] leading-[1.3] placeholder:font-sans placeholder:text-[14px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[myPen].className}`}
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-3 text-[13px] text-pencil">
          취소
        </button>
        <button
          type="submit"
          disabled={saving || body.trim().length === 0}
          className="h-9 rounded-full bg-ink px-4 text-[13px] text-page disabled:opacity-40"
        >
          {saving ? "남기는 중…" : "답글 남기기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-pen-orange">
          {error}
        </p>
      )}
    </form>
  );
}
