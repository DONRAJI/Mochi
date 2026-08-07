import Link from "next/link";

/**
 * 계정·데이터 삭제 안내 (플레이스토어 데이터 안전 — 삭제 요청 URL). 공개 페이지(미들웨어 매처 밖).
 * 앱을 지웠거나 접근이 어려운 사용자도 여기 안내대로 삭제를 요청할 수 있어야 한다.
 */
export const metadata = {
  title: "계정 및 데이터 삭제 — 모찌",
};

const CONTACT_EMAIL = "05likesea@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-base text-cocoa">{title}</h2>
      <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-cocoa-soft">{children}</div>
    </section>
  );
}

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-title text-cocoa">계정 및 데이터 삭제</h1>
        <p className="text-sm text-cocoa-faint">모찌 (Mochi)</p>
      </header>

      <Section title="앱에서 바로 삭제하기">
        <p>모찌 앱에 로그인한 상태라면 아래 순서로 직접 삭제할 수 있어요.</p>
        <ol className="list-decimal pl-5">
          <li>앱 하단의 <b>마이</b> 탭으로 이동</li>
          <li>화면 맨 아래 <b>계정 탈퇴</b> 선택</li>
          <li>안내를 확인하고 <b>탈퇴하기</b> 선택</li>
        </ol>
        <p>탈퇴하면 계정과 모든 데이터가 즉시 삭제되며, 되돌릴 수 없어요.</p>
      </Section>

      <Section title="앱에 접근할 수 없다면">
        <p>
          앱을 삭제했거나 로그인이 어려우면, 가입에 사용한 이메일로 아래 주소에 &ldquo;계정 삭제
          요청&rdquo;이라고 보내주세요. 본인 확인 후 처리해 드립니다.
        </p>
        <p className="font-display text-cocoa">{CONTACT_EMAIL}</p>
      </Section>

      <Section title="삭제되는 데이터">
        <p>삭제 시 아래 정보가 모두 완전히 지워집니다(별도 보관하지 않아요).</p>
        <ul className="list-disc pl-5">
          <li>계정 정보(이메일·닉네임·비밀번호)</li>
          <li>식사 기록·체중 기록·식사 사진</li>
          <li>모찌 도감·수집 카드·씨앗</li>
          <li>냉장고 재료·장보기·주간 식단</li>
          <li>취향(선호·비선호·알러지)·맞춤 프로필</li>
        </ul>
      </Section>

      <Section title="처리 기간">
        <p>
          앱 내 탈퇴는 <b>즉시</b> 처리됩니다. 이메일 요청은 확인 후 지체 없이(영업일 기준 며칠 이내)
          삭제합니다.
        </p>
      </Section>

      <Link
        href="/"
        className="self-center rounded-mochi bg-mint px-5 py-2.5 text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-95"
      >
        홈으로
      </Link>
    </main>
  );
}
