import type { Household, Member } from "@/domain/types";

/**
 * Extra context kept with a local mock profile. These fields are deliberately
 * not part of the production household contract yet: the planner currently
 * consumes the member's age band, activity, habits, conditions and dislikes.
 * Keeping the richer context beside the fixture prevents us from inventing
 * persistent medical or body-measurement fields before the product has a
 * reviewed data model for them.
 */
export interface MockMemberContext {
  memberId: string;
  ageYears: number;
  ageMonths?: number;
  heightCm?: number;
  weightKg?: number;
  occupation?: string;
  mealPattern?: string[];
  healthNotes?: string[];
  foodNotes?: string[];
}

export interface MockFamilyProfile {
  household: Household;
  memberContexts: MockMemberContext[];
}

const members: Member[] = [
  {
    id: "lam",
    name: "Nguyễn Cảnh Lâm",
    role: "adult",
    sex: "M",
    activity: "light",
    habits: ["ưu tiên món miền Bắc", "thích món luộc", "thích thịt gà", "thích canh cua", "thích cà pháo"],
    conditions: [],
    dislikes: ["mắm tôm", "mắm tép", "món nhiều dầu mỡ", "món chế biến cầu kỳ"],
    allergies: [],
    contextProfile: {
      ageYears: 41,
      heightCm: 173,
      weightKg: 59,
      routine: ["văn phòng, công việc trí não", "ít ăn sáng"],
      foodNotes: ["vẫn ăn nước mắm", "không thích mắm tôm và mắm tép"],
      wellbeingNotes: ["không bệnh nền", "sức khỏe bình thường"],
    },
  },
  {
    id: "quynh",
    name: "Trần Thị Quỳnh",
    role: "adult",
    sex: "F",
    activity: "moderate",
    habits: [
      "ẩm thực miền Bắc",
      "ưu tiên nguyên liệu tươi",
      "quan tâm dinh dưỡng",
      "thích nấu ăn",
      "có kinh nghiệm bánh mì Âu",
      "có kinh nghiệm phở",
      "quan tâm thực phẩm bổ sung",
    ],
    conditions: [],
    dislikes: ["lá dấp cá", "nguyên liệu không tươi", "món sai vị"],
    allergies: [],
    contextProfile: {
      ageYears: 39,
      routine: ["chăm sóc bữa ăn và dinh dưỡng gia đình"],
      foodNotes: ["ăn được hầu hết món", "không thích món không tươi hoặc sai vị"],
      wellbeingNotes: ["quan tâm dinh dưỡng cá nhân"],
    },
  },
  {
    id: "cherry",
    name: "Cherry",
    role: "child",
    ageBand: "11-14",
    activity: "moderate",
    habits: ["đang dậy thì", "thích đồ ăn hiện đại", "thích thịt nướng", "ít ăn rau"],
    conditions: [],
    dislikes: ["hải sản", "sầu riêng"],
    allergies: [],
    contextProfile: {
      ageYears: 14,
      foodNotes: ["không kiêng món nào ngoài sầu riêng", "không chuộng hải sản"],
      wellbeingNotes: ["đang trong giai đoạn dậy thì"],
    },
  },
  {
    id: "com",
    name: "Cốm",
    role: "child",
    ageBand: "0-2",
    activity: "moderate",
    habits: ["ăn uống đa dạng", "ăn uống khỏe mạnh"],
    conditions: [],
    dislikes: [],
    allergies: [],
    contextProfile: {
      ageYears: 2,
      ageMonths: 10,
      foodNotes: ["không có món kiêng"],
      wellbeingNotes: ["ăn uống khỏe mạnh"],
    },
  },
  {
    id: "ba-noi",
    name: "Bà nội Cốm",
    role: "adult",
    sex: "F",
    activity: "light",
    habits: ["ẩm thực miền Bắc", "thích ăn rau"],
    conditions: [],
    dislikes: [],
    allergies: [],
    contextProfile: {
      ageYears: 65,
      foodNotes: ["thích ăn rau", "không kiêng món nào"],
      wellbeingNotes: ["sức khỏe tốt", "đau chân và đau lưng thỉnh thoảng"],
    },
  },
];

/** A safe, explicit family scenario for local and E2E testing only. */
export const MOCK_FAMILY_LAM_QUYNH: MockFamilyProfile = {
  household: {
    id: "hh_default",
    name: "Nhà Lâm – Quỳnh",
    size: 5,
    marketMode: "mixed",
    cookTimeCapMin: 45,
    busyDays: [],
    lactatingMember: false,
    members,
    restrictions: [],
  },
  memberContexts: [
    {
      memberId: "lam",
      ageYears: 41,
      heightCm: 173,
      weightKg: 59,
      occupation: "văn phòng, công việc trí não",
      mealPattern: ["ít ăn sáng"],
      healthNotes: ["không bệnh nền", "sức khỏe bình thường"],
      foodNotes: ["vẫn ăn nước mắm", "không thích mắm tôm và mắm tép"],
    },
    {
      memberId: "quynh",
      ageYears: 39,
      occupation: "chăm sóc bữa ăn và dinh dưỡng gia đình",
      healthNotes: ["quan tâm dinh dưỡng cá nhân"],
      foodNotes: ["ăn được hầu hết món", "không ăn lá dấp cá", "không thích món không tươi hoặc sai vị"],
    },
    {
      memberId: "cherry",
      ageYears: 14,
      healthNotes: ["đang trong giai đoạn dậy thì"],
      foodNotes: ["không kiêng món nào ngoài sầu riêng", "không chuộng hải sản"],
    },
    {
      memberId: "com",
      ageYears: 2,
      ageMonths: 10,
      healthNotes: ["ăn uống khỏe mạnh"],
      foodNotes: ["không có món kiêng"],
    },
    {
      memberId: "ba-noi",
      ageYears: 65,
      healthNotes: ["sức khỏe tốt", "đau chân và đau lưng thỉnh thoảng"],
      foodNotes: ["thích ăn rau", "không kiêng món nào"],
    },
  ],
};

export function cloneMockFamilyHousehold(): Household {
  return structuredClone(MOCK_FAMILY_LAM_QUYNH.household);
}
