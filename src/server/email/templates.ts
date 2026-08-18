import "server-only";

/**
 * 메일 본문 — 모찌 보이스로(불변 #1: 빨강·"실패"·재촉 없음).
 * 색은 디자인 토큰 값과 같게 두되, 메일 클라이언트는 Tailwind를 모르니 인라인 스타일로 쓴다
 * (불변 #4는 앱 화면 규칙 — 여기선 토큰 '값'을 지키는 것으로 취지를 따른다).
 */
const CREAM = "#FFF8F0";
const COCOA = "#6B5B53";
const COCOA_SOFT = "#8C7D74";
const MINT = "#BCEBD3";

function layout(body: string): string {
  return `<div style="background:${CREAM};padding:32px 16px;font-family:'Apple SD Gothic Neo',system-ui,sans-serif;color:${COCOA}">
  <div style="max-width:440px;margin:0 auto;background:#FFFDFA;border-radius:24px;padding:28px">
    ${body}
    <p style="margin-top:24px;font-size:12px;color:${COCOA_SOFT};line-height:1.6">
      혹시 요청하지 않으셨다면 이 메일은 그냥 두셔도 괜찮아요.
    </p>
  </div>
  <p style="text-align:center;margin-top:16px;font-size:12px;color:${COCOA_SOFT}">🧊 모찌</p>
</div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${MINT};color:${COCOA};text-decoration:none;padding:12px 24px;border-radius:16px;font-size:15px">${label}</a>`;
}

export function verifyEmailTemplate(nickname: string, link: string) {
  return {
    subject: "모찌예요 — 이메일 한 번만 확인해 주세요",
    html: layout(`
      <p style="font-size:18px;margin:0 0 8px">${escapeHtml(nickname)}님, 반가워요!</p>
      <p style="font-size:15px;color:${COCOA_SOFT};line-height:1.7;margin:0 0 20px">
        아래 버튼을 눌러 이메일을 확인해 주세요. 나중에 비밀번호를 잊었을 때
        이 주소로 다시 찾을 수 있어요.
      </p>
      ${button(link, "이메일 확인하기")}
      <p style="font-size:12px;color:${COCOA_SOFT};margin-top:20px">이 링크는 24시간 동안 쓸 수 있어요.</p>
    `),
  };
}

export function resetPasswordTemplate(nickname: string, link: string) {
  return {
    subject: "모찌예요 — 비밀번호를 새로 정해요",
    html: layout(`
      <p style="font-size:18px;margin:0 0 8px">${escapeHtml(nickname)}님, 괜찮아요</p>
      <p style="font-size:15px;color:${COCOA_SOFT};line-height:1.7;margin:0 0 20px">
        누구나 잊어버려요. 아래 버튼을 눌러 새 비밀번호를 정해 주세요.
      </p>
      ${button(link, "새 비밀번호 정하기")}
      <p style="font-size:12px;color:${COCOA_SOFT};margin-top:20px">이 링크는 1시간 동안 쓸 수 있어요.</p>
    `),
  };
}

/** 닉네임은 사용자 입력 — 메일 HTML에 그대로 넣지 않는다(security.md §7 XSS 계승). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
