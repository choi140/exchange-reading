import { AppShell } from "@/components/AppShell";
import { ClaimKey, RecoveryKey } from "@/components/RecoveryKey";

// 10-1 나만의 열쇠: 만들기 / 다른 브라우저에서 되찾기
export default function KeyPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[960px] px-5 pb-20 pt-10 sm:px-8">
        <header>
          <h1 className="font-display text-[40px] leading-tight text-ink">나만의 열쇠</h1>
          <p className="mt-3 max-w-[32em] text-[15px] leading-relaxed text-pencil">
            로그인 대신 쓰는 열쇠예요. 열쇠가 있으면 다른 브라우저나 휴대폰에서도 내 책, 일기장, 짝과의 교환일기를 그대로 이어 쓸 수 있어요.
          </p>
        </header>
        <section aria-labelledby="my-key" className="mt-10">
          <h2 id="my-key" className="font-display text-[24px] text-ink">
            이 브라우저의 열쇠
          </h2>
          <div className="mt-3">
            <RecoveryKey />
          </div>
        </section>
        <section aria-labelledby="claim" className="mt-12">
          <h2 id="claim" className="font-display text-[24px] text-ink">
            다른 브라우저에서 쓰던 기록 되찾기
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-pencil">
            예전 브라우저에서 만든 열쇠를 넣으면, 그 기록을 이 브라우저로 옮겨 와요.
          </p>
          <div className="mt-4">
            <ClaimKey />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
