// Mental-health support resources shown on the crisis branch — VERIFIED ONLY.
// §3.4 of TIP-MOOD: never fabricate a number. Every entry is either verified from
// a primary/corroborated source (with sourceUrl) or is universally-known guidance.
// If a resource can't be verified current, it does NOT go here.
export interface SupportResource {
  name: string;
  detail: string; // phone / channel / action
  hours?: string;
  url?: string;
  sources: string[]; // provenance for the fact above
}

export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    name: "Đường dây nóng Ngày Mai",
    detail: "096 306 1414",
    hours: "13:00–20:30, Thứ 4 đến Chủ Nhật",
    url: "https://duongdaynongngaymai.vn/",
    // Free, non-judgmental, confidential psychological support hotline.
    sources: [
      "duongdaynongngaymai.vn (trang chính thức)",
      "svvn.tienphong.vn",
      "laodong.vn",
      "findahelpline.com/organizations/ngay-mai",
    ],
  },
  {
    name: "Cấp cứu y tế",
    detail: "115",
    hours: "24/7",
    // Vietnam national emergency medical number — use if there is immediate danger.
    sources: ["Số cấp cứu y tế quốc gia Việt Nam (115)"],
  },
];

// General guidance shown alongside the resources — always valid, no number to verify.
export const SUPPORT_GUIDANCE = [
  "Nói với một người bạn tin tưởng — người nhà, bạn thân.",
  "Gặp bác sĩ, hoặc tới cơ sở y tế gần nhất nếu thấy không ổn.",
];

// Extra line for postpartum context (emotional difficulty after birth is real + common).
export const POSTPARTUM_SUPPORT_NOTE =
  "Khó khăn cảm xúc sau sinh là điều có thật và phổ biến — không phải lỗi của bạn. Hãy nói với bác sĩ sản/khoa của mình.";
