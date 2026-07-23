import Link from "next/link";

/**
 * 개인정보처리방침 (플레이스토어 필수) — 공개 페이지(미들웨어 매처 밖, 로그인 불필요).
 * ⚠️ 게시 전 [문의 이메일] 자리를 실제 연락처로 바꿀 것. 내용은 실제 처리 실태와 일치해야 한다.
 */

export const metadata = {
  title: "개인정보처리방침 — 모찌",
};

const CONTACT_EMAIL = "[문의 이메일 주소를 넣어주세요]"; // TODO(사용자): 실제 이메일로 교체

const EFFECTIVE_DATE = "2026년 7월 23일";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-base text-cocoa">{title}</h2>
      <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-cocoa-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-title text-cocoa">개인정보처리방침</h1>
        <p className="text-sm text-cocoa-faint">모찌 (Mochi) · 시행일 {EFFECTIVE_DATE}</p>
      </header>

      <Section title="1. 개요">
        <p>
          모찌(이하 &ldquo;서비스&rdquo;)는 식사 제안·기록·수집 기능을 제공하는 다이어트 컴패니언
          앱입니다. 서비스는 이용자의 개인정보를 소중히 다루며, 관련 법령을 준수합니다. 이 문서는
          서비스가 어떤 정보를 왜 수집하고 어떻게 보관·파기하는지 설명합니다.
        </p>
      </Section>

      <Section title="2. 수집하는 개인정보">
        <p>서비스는 다음 정보를 이용자가 직접 입력할 때 수집합니다.</p>
        <ul className="list-disc pl-5">
          <li>계정: 이메일, 비밀번호(암호화하여 저장), 닉네임, 요리 성향</li>
          <li>취향: 선호·비선호 음식, 알러지 정보(선택)</li>
          <li>기록: 냉장고 재료, 식사 기록(끼니·시각), 체중 기록(선택), 식사 사진(선택)</li>
          <li>맞춤 프로필(선택): 출생연도, 성별, 키, 활동량</li>
          <li>자동 수집: 로그인 세션 쿠키(서비스 이용 유지 목적)</li>
        </ul>
        <p>
          알러지·체중·신체 프로필은 건강과 관련된 민감할 수 있는 정보로, 이용자가 선택적으로
          입력하며 아래 목적 외에는 사용하지 않습니다.
        </p>
      </Section>

      <Section title="3. 수집 목적">
        <ul className="list-disc pl-5">
          <li>식사 추천·기록·수집(도감) 등 핵심 기능 제공</li>
          <li>알러지 제외, 취향 반영, 맞춤 가이드 등 개인화</li>
          <li>로그인 상태 유지 및 계정 보호</li>
        </ul>
        <p>서비스는 광고 목적의 수집·프로파일링을 하지 않습니다.</p>
      </Section>

      <Section title="4. 보유 기간 및 파기">
        <p>
          개인정보는 서비스 이용 기간 동안 보관하며, 계정 삭제 시 지체 없이 파기합니다. 계정 및
          데이터 삭제를 원하시면 아래 문의처로 요청해 주세요. 요청을 확인한 뒤 관련 데이터(기록·사진
          포함)를 삭제합니다.
        </p>
      </Section>

      <Section title="5. 제3자 제공">
        <p>서비스는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다.</p>
      </Section>

      <Section title="6. 처리 위탁 (인프라)">
        <p>서비스 운영을 위해 다음 인프라에 데이터 보관을 위탁합니다.</p>
        <ul className="list-disc pl-5">
          <li>Vercel: 서비스 호스팅</li>
          <li>Supabase: 데이터베이스, 식사 사진 저장(비공개 저장소)</li>
        </ul>
      </Section>

      <Section title="7. 이용자의 권리">
        <p>
          이용자는 언제든지 자신의 정보 열람·정정·삭제를 요청할 수 있습니다. 앱 내에서 직접
          수정·삭제할 수 있는 항목(재료·기록·취향·프로필 등)은 해당 화면에서, 그 외에는 문의처를
          통해 요청해 주세요.
        </p>
      </Section>

      <Section title="8. 쿠키">
        <p>
          로그인 유지를 위한 세션 쿠키만 사용합니다(HttpOnly — 스크립트에서 접근 불가). 광고·추적
          쿠키는 사용하지 않습니다.
        </p>
      </Section>

      <Section title="9. 안전성 확보 조치">
        <ul className="list-disc pl-5">
          <li>비밀번호는 복호화 불가능한 방식으로 암호화하여 저장</li>
          <li>식사 사진은 비공개 저장소에 보관하며 본인만 열람 가능(짧은 만료의 서명 URL)</li>
          <li>모든 통신은 HTTPS로 암호화</li>
        </ul>
      </Section>

      <Section title="10. 문의처">
        <p>개인정보 관련 문의·삭제 요청: {CONTACT_EMAIL}</p>
      </Section>

      <p className="text-xs text-cocoa-faint">
        이 방침은 {EFFECTIVE_DATE}부터 적용됩니다. 내용이 바뀌면 이 페이지에서 안내합니다.
      </p>

      <Link
        href="/"
        className="self-center rounded-mochi bg-mint px-5 py-2.5 text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-95"
      >
        홈으로
      </Link>
    </main>
  );
}
