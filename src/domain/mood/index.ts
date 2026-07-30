import type { Dish } from "@/domain/types";

// Mood-food advisory – SAFETY-FIRST. The crisis gate is deterministic and runs
// before any suggestion; food is retrieved from REAL dish attributes only; every
// suggestion is tiered and never up-ranked. No pseudo-science, no diagnosis.

export type Tier = "practical" | "research" | "comfort";
export type MoodKey = "stress" | "tired" | "sleepless" | "low" | "normal";
export type CrisisSeverity = "watch" | "crisis";

// ── Crisis detection (deterministic, high-recall, escalation-biased) ─────────
// Fold Vietnamese diacritics so matching is robust to typing without dấu.
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

// Intent phrases (NOT bare morbid words like "chết" – avoids false alarms on
// "đói chết được"). Stored folded. severity "crisis" = self-harm/suicide intent.
// severity "crisis" = self-harm/suicide intent, INCLUDING indirect "self-as-burden"
// forms (how depression – esp. postpartum – often actually speaks; no direct verb).
const CRISIS_PHRASES = [
  "muon chet", "chi muon chet", "khong muon song", "chan song", "chan khong muon song",
  "tu tu", "tu sat", "tu lam hai", "lam hai ban than", "lam dau ban than", "tu hai minh",
  "cat tay minh", "ket thuc cuoc doi", "ket thuc tat ca", "chet cho xong", "chet cho roi",
  "bien mat khoi cuoc doi", "khong thiet song", "khong con muon ton tai",
  // indirect self-as-burden – high signal, catch for everyone
  "con se tot hon neu khong co toi", "moi nguoi se tot hon neu khong co toi",
  "the gioi tot hon khi khong co toi", "gia dinh tot hon khi khong co toi",
  "khong co toi moi nguoi se on hon",
  // EN
  "kill myself", "want to die", "end my life", "end it all", "suicide", "self harm",
  "self-harm", "hurt myself", "dont want to live", "do not want to live", "no reason to live",
  "better off without me", "everyone better off without me",
];
// severity "watch" = distress beyond "hôm nay hơi mệt" – still stop suggesting food.
// Leans toward catching indirect despair (a false positive here is mild; a miss is not).
const DISTRESS_PHRASES = [
  "tuyet vong", "vo vong", "vo gia tri", "khong con y nghia", "khong thiet an", "khong thiet gi",
  "trong rong", "be tac", "be tac hoan toan", "khong chiu noi nua", "khong chiu dung noi",
  "guc nga hoan toan", "kiet que", "mat ngu nhieu ngay", "mat ngu trien mien", "buon keo dai", "khoc suot",
  // indirect despair / can't-hold-on / no-way-out
  "khong tru noi nua", "khong tru duoc nua", "khong gong noi nua", "khong gong duoc nua",
  "khong the tiep tuc nua", "khong chiu them duoc", "muon buong bo tat ca", "muon tu bo tat ca",
  "khong thay loi thoat", "khong con loi thoat", "mat het hy vong", "khong muon o day nua",
  "moi thu that vo nghia", "song khong con y nghia",
  "hopeless", "worthless", "cant cope", "can't cope", "cant go on", "can't go on",
  "empty inside", "no point", "cant hold on", "can't hold on", "no way out",
];
// Only checked when the household has a postpartum member (lower threshold). PPD
// self-blame / burden phrasings that are venting-ish out of context but are real
// signals for a new mother.
const POSTPARTUM_PHRASES = [
  "ghet con", "so lam hai con", "khong thuong con duoc", "hoi han sinh con", "khong lo cho con noi",
  "la me toi", "mot nguoi me toi", "khong xung dang lam me",
  "la ganh nang cho con", "la ganh nang cho gia dinh", "con xung dang nguoi me tot hon",
];

export function detectCrisis(text: string | undefined, opts?: { postpartum?: boolean }): { crisis: boolean; severity?: CrisisSeverity } {
  const t = fold(text ?? "");
  if (!t) return { crisis: false };
  if (CRISIS_PHRASES.some((p) => t.includes(p))) return { crisis: true, severity: "crisis" };
  if (DISTRESS_PHRASES.some((p) => t.includes(p))) return { crisis: true, severity: "watch" };
  if (opts?.postpartum && POSTPARTUM_PHRASES.some((p) => t.includes(p))) return { crisis: true, severity: "watch" };
  return { crisis: false };
}

// ── Situation → real-attribute retrieval + tiered notes ──────────────────────
interface Situation {
  pick: (d: Dish) => boolean;
  dishTier: Exclude<Tier, "research">; // dishes are practical or comfort; research is a note, never a dish claim
  whyDish: string;
  practicalNote: string; // the strongest lever is usually reducing the cooking burden / eating regularly
  researchNote?: string; // tier "research" – "một số nghiên cứu liên hệ…", never therapeutic/causal
  caffeineNote?: boolean;
}

const quickish = (d: Dish) => d.quick || (d.cookTimeMin ?? 99) <= 20;
const light = (d: Dish) =>
  d.method === "luoc" || d.method === "hap" || d.slot === "CANH" || !!d.tags?.includes("thanh");

export const SITUATION_MAP: Record<MoodKey, Situation> = {
  stress: {
    pick: quickish,
    dishTier: "practical",
    whyDish: "dễ nấu, đỡ phải nghĩ nhiều khi đang căng",
    practicalNote: "Cứ ăn đều và đủ nước – đừng bỏ bữa. Khi mệt, chọn món gọn còn quan trọng hơn chọn món “bổ”.",
    researchNote: "Một số nghiên cứu liên hệ omega-3 (cá) và magie (rau lá, hạt) với tâm trạng ở mức dân số – đây không phải thuốc và không chữa được điều gì.",
  },
  tired: {
    pick: quickish,
    dishTier: "practical",
    whyDish: "gọn, ít công, tái dùng được đồ đang có",
    practicalNote: "Mệt rã thì ưu tiên món có sẵn hoặc một-nồi; ăn đủ để có sức, không cần cầu kỳ.",
  },
  sleepless: {
    pick: light,
    dishTier: "practical",
    whyDish: "bữa tối nhẹ, dễ tiêu",
    practicalNote: "Bữa tối nhẹ nhàng; nếu khó ngủ, hạn chế cà phê/trà từ chiều.",
    caffeineNote: true,
  },
  low: {
    pick: (d) => d.slot === "CANH" || d.quick,
    dishTier: "comfort",
    whyDish: "món ấm, quen thuộc – để tự an ủi mình một chút",
    practicalNote: "Một món quen, ăn cùng người nhà nếu được – đôi khi vậy là đủ.",
  },
  normal: {
    pick: (d) => d.quick || (d.cookTimeMin ?? 99) <= 25,
    dishTier: "practical",
    whyDish: "cân bằng, dễ làm",
    practicalNote: "Ăn đều, đủ rau và nước.",
  },
};

export interface MoodSuggestion { dishId: string; tier: Exclude<Tier, "research">; why: string; }

/** Retrieve tier-labeled REAL dishes for a mood. Only allowed dishes (allergies +
 *  diet) pass. Deterministic; the caller MUST have cleared the crisis gate first. */
export function moodSuggestions(
  mood: MoodKey,
  dishes: Dish[],
  isAllowed: (d: Dish) => boolean,
  max = 3,
): MoodSuggestion[] {
  const s = SITUATION_MAP[mood];
  const out: MoodSuggestion[] = [];
  const seen = new Set<string>();
  for (const d of dishes) {
    if (out.length >= max) break;
    if (seen.has(d.id) || !isAllowed(d) || !s.pick(d)) continue;
    seen.add(d.id);
    out.push({ dishId: d.id, tier: s.dishTier, why: s.whyDish });
  }
  return out;
}

export type Advisory =
  | { mode: "crisis"; severity: CrisisSeverity }
  | { mode: "suggest"; mood: MoodKey; suggestions: MoodSuggestion[]; practicalNote: string; researchNote?: string; caffeineNote?: boolean };

/** The single safe entry: gate FIRST, then (only if clear) suggest food. A crisis
 *  input can never produce a food suggestion. */
export function advise(
  input: { text?: string; mood: MoodKey; postpartum?: boolean },
  dishes: Dish[],
  isAllowed: (d: Dish) => boolean,
): Advisory {
  const gate = detectCrisis(input.text, { postpartum: input.postpartum });
  if (gate.crisis) return { mode: "crisis", severity: gate.severity ?? "watch" };
  const s = SITUATION_MAP[input.mood];
  return {
    mode: "suggest",
    mood: input.mood,
    suggestions: moodSuggestions(input.mood, dishes, isAllowed),
    practicalNote: s.practicalNote,
    researchNote: s.researchNote,
    caffeineNote: s.caffeineNote,
  };
}
