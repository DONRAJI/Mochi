/** 스켈레톤용 mock (record 서비스 연동 시 교체). 숫자는 마이>더보기에서만 노출 (불변 #2). */
export interface WeightPoint {
  month: string;
  avg: number;
}

export const MOCK_WEIGHT: WeightPoint[] = [
  { month: "2월", avg: 61.4 },
  { month: "3월", avg: 60.8 },
  { month: "4월", avg: 60.9 },
  { month: "5월", avg: 60.1 },
  { month: "6월", avg: 59.6 },
];

export const ME_MENU = [
  { emoji: "⚖️", label: "체중 기록", hint: "원할 때만" },
  { emoji: "🎀", label: "모찌 꾸미기", hint: "옷·테마" },
  { emoji: "🔔", label: "알림", hint: "" },
  { emoji: "⚙️", label: "설정", hint: "" },
] as const;
