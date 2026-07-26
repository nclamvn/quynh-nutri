import type { ProvenanceLevel } from "@/domain/types";

// Arbitration order for the refinery (INTAKE-SEED §5). Lower P wins when sources
// disagree; a number reaches `corroborated` only with ≥2 independent agreeing
// sources, else `disputed`/`honest_null` — never guessed.
export const SOURCE_REGISTRY: Record<
  ProvenanceLevel,
  { rank: number; name: string; role: string }
> = {
  P1: { rank: 1, name: "Bảng Thành phần Thực phẩm VN (Viện Dinh dưỡng 2017)", role: "Canonical macro/100g" },
  P2: { rank: 2, name: "Nhu cầu Dinh dưỡng Khuyến nghị 2016 (QĐ 2615/QĐ-BYT)", role: "Canonical nhu cầu" },
  P3: { rank: 3, name: "HD dinh dưỡng mẹ mang thai & cho con bú 2017 (QĐ 776)", role: "Vertical mẹ sau sinh" },
  P4: { rank: 4, name: "FAO/INFOODS ASEAN", role: "Đối chiếu khu vực" },
  P5: { rank: 5, name: "USDA FoodData Central", role: "Đối chiếu quốc tế" },
  P6: { rank: 6, name: "WHO/FAO nutrient recommendations", role: "Backstop vi chất" },
};
