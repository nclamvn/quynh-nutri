import type { KitchenAgendaTask } from "@/domain/kitchen-execution/kitchen-agenda";

export const DEFAULT_REMINDER_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const DEFAULT_REMINDER_HOUR = 7;
export const REMINDER_WINDOW_MINUTES = 15;
export const MAX_REMINDERS_PER_DISPATCH = 3;

const SAFE_REMINDER_PATHS = new Set(["/week", "/shopping", "/pantry"]);

export interface ReminderClock {
  calendarDate: string;
  hour: number;
  minute: number;
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || timeZone.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function clockInTimeZone(now: Date, timeZone: string): ReminderClock {
  if (!isValidTimeZone(timeZone)) throw new Error("INVALID_TIME_ZONE");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    calendarDate: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

export function isReminderWindow(
  now: Date,
  timeZone: string,
  reminderHour: number,
): boolean {
  if (!Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
    return false;
  }
  const clock = clockInTimeZone(now, timeZone);
  return clock.hour === reminderHour && clock.minute < REMINDER_WINDOW_MINUTES;
}

export function safeReminderHref(raw: string): string {
  try {
    const parsed = new URL(raw, "https://anngon.io");
    if (parsed.origin !== "https://anngon.io") return "/overview";
    return SAFE_REMINDER_PATHS.has(parsed.pathname)
      ? `${parsed.pathname}${parsed.hash}`
      : "/overview";
  } catch {
    return "/overview";
  }
}

export function reminderTasks(
  tasks: readonly KitchenAgendaTask[],
): KitchenAgendaTask[] {
  return tasks
    .filter((task) => task.priority === "now" || task.priority === "today")
    .slice(0, MAX_REMINDERS_PER_DISPATCH);
}

export function reminderCopy(task: KitchenAgendaTask): {
  title: string;
  body: string;
} {
  switch (task.kind) {
    case "review-leftover":
      return {
        title: "Xem lại món còn thừa",
        body: "Mở món còn thừa đã xác nhận để kiểm tra trước khi dùng.",
      };
    case "review-inventory-label":
      return {
        title: "Xem lại nhãn bảo quản",
        body: "Có lô thực phẩm cần xem lại theo ngày trên nhãn gia đình đã nhập.",
      };
    case "prepare-frozen":
      return {
        title: "Chuẩn bị nguyên liệu đông lạnh",
        body: "Thực đơn ngày mai cần nguyên liệu đang được cất trong ngăn đông.",
      };
    case "prep-ahead":
      return {
        title: "Chuẩn bị trước cho ngày mai",
        body: "Có món trong thực đơn ngày mai đã có hướng dẫn chuẩn bị trước.",
      };
    case "confirm-purchase":
      return {
        title: "Xác nhận hàng đã mua",
        body: "Danh sách chợ có mặt hàng đã đánh dấu nhưng chưa ghi nhận hàng thực mua.",
      };
    case "cook":
      return {
        title: "Chuẩn bị nấu món hôm nay",
        body: "Món trong thực đơn hôm nay đã có hướng dẫn nấu được rà soát.",
      };
    case "coordinate-meal":
      return {
        title: "Phối hợp bữa cơm hôm nay",
        body: "Các món hôm nay đã đủ hướng dẫn để xem thứ tự chuẩn bị.",
      };
    case "shop":
      return {
        title: "Hoàn tất danh sách chợ",
        body: "Danh sách vẫn còn mặt hàng chưa được gia đình xác nhận mua.",
      };
  }
}
