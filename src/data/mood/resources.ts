// Mental-health support resources shown on the crisis branch – VERIFIED ONLY.
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
    // SAFETY: list the exact days – Wed/Fri/Sat/Sun, NO Thursday. A dash-range
    // "T4–CN" reads as continuous (incl. Thursday) → someone in crisis could call
    // on a day no one answers. Do NOT collapse to a range.
    hours: "13:00–20:30 · Thứ 4, Thứ 6, Thứ 7, Chủ Nhật",
    url: "https://duongdaynongngaymai.vn/",
    // Free, non-judgmental, confidential psychological listening line.
    sources: [
      "duongdaynongngaymai.vn (trang chính thức)",
      "DoanhnhanPlus",
      "Bệnh viện Lê Lợi (2026)",
    ],
  },
  {
    name: "Cấp cứu trầm cảm (BV Tâm thần TP.HCM)",
    detail: "1900 1267",
    hours: "24/7 · chuyên tâm lý",
    // Fills the after-hours gap outside Ngày Mai's fixed days. Corroborated by the
    // hospital's official site + VOV + a state health station.
    sources: [
      "bvtt-tphcm.org.vn (trang chính thức)",
      "vov.gov.vn",
      "medinet.gov.vn",
    ],
  },
  {
    name: "Cấp cứu y tế",
    detail: "115",
    hours: "24/7",
    // Vietnam national emergency medical number – use if there is immediate danger.
    sources: ["Số cấp cứu y tế quốc gia Việt Nam (115)"],
  },
];

// General guidance shown alongside the resources – always valid, no number to verify.
export const SUPPORT_GUIDANCE = [
  "Nói với một người bạn tin tưởng – người nhà, bạn thân.",
  "Gặp bác sĩ, hoặc tới cơ sở y tế gần nhất nếu thấy không ổn.",
];

// Extra line for postpartum context (emotional difficulty after birth is real + common).
export const POSTPARTUM_SUPPORT_NOTE =
  "Khó khăn cảm xúc sau sinh là điều có thật và phổ biến – không phải lỗi của bạn. Hãy nói với bác sĩ sản/khoa của mình.";
