/**
 * 낙관적 임시 항목(temp-…) 취소 코디네이션.
 *
 * 낙관적 추가는 서버 id가 오기 전 임시 id로 즉시 표시한다. 이 짧은 창에서 사용자가 그 항목을
 * 지우면, 서버는 임시 id를 모르므로 DELETE가 403/404로 실패하고 롤백되며 항목이 되살아난다.
 * → 임시 항목 삭제를 '서버 호출 없이 취소 표시'로 처리하고, 추가가 완료되어 실제 id가 생기면
 *   대응 실제 항목을 서버에서 정리한다(재생성 방지). 도메인별로 하나씩 만들어 쓴다.
 */
export function makeTempCanceller() {
  const canceled = new Set<string>();
  return {
    /** 아직 서버에 없는 낙관적 항목인지. */
    isTemp: (id: string) => id.startsWith("temp-"),
    /** 임시 항목 삭제 요청을 취소로 기록(서버 호출 대신). */
    cancel: (id: string) => {
      canceled.add(id);
    },
    /** 이 임시 id가 취소됐으면 true를 돌려주며 1회 소비. (추가 성공 시 실제 항목 정리 판단용) */
    consume: (tempId: string) => canceled.delete(tempId),
  };
}
