#!/usr/bin/env node
// Claude Code PreToolUse 훅: 새 의존성 설치를 차단하고 사람 승인을 요구한다.
// 락파일에서 전체 설치(npm install / npm ci / pnpm install / yarn)는 허용.
// 특정 패키지 추가(npm i <pkg>, npm install <pkg>, npm add, yarn add, pnpm add)는 exit 2로 차단.
let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let cmd = "";
  try { cmd = JSON.parse(input)?.tool_input?.command ?? ""; } catch {}

  // 설치 명령 + 뒤따르는 인자 추출
  const re = /(?:^|\s|&&|;|\|)\s*(npm\s+(?:i|install|add)|yarn\s+add|pnpm\s+(?:i|install|add))\b([^\n;|&]*)/;
  const m = cmd.match(re);
  if (m) {
    const verb = m[1].replace(/\s+/g, " ").trim();
    const args = (m[2] || "").trim();
    const isAdd = /\b(?:add)\b/.test(verb);                 // yarn add / pnpm add / npm add → 항상 패키지 추가
    const npmInstallPkg = /npm\s+(?:i|install)/.test(verb)  // npm i/install + 비-플래그 인자 → 패키지 추가
                          && args && !args.startsWith("-");
    const pnpmInstallPkg = /pnpm\s+(?:i|install)/.test(verb)
                          && args && !args.startsWith("-");
    if (isAdd || npmInstallPkg || pnpmInstallPkg) {
      console.error(
        "🧊 모찌 규칙: 새 의존성 설치는 사람 승인이 필요해요.\n" +
        "  명령: " + cmd.trim() + "\n" +
        "  → 정말 필요하면 rules/conventions.md 의존성 정책에 따라 PR에 사유를 남기고 직접 설치하세요."
      );
      process.exit(2); // PreToolUse에서 2 = 차단 + stderr를 모델에 전달
    }
  }
  process.exit(0);
});
