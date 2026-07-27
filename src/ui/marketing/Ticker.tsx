// Rose full-width marquee — bridges hero → content. Two identical tracks slide
// -50% so the loop is seamless. Uppercase small, star separators (lime, sparing).
const ITEMS = [
  "Xoay món thông minh",
  "Định lượng có nguồn",
  "Đi chợ một lần, dùng cả tuần",
  "Không phán số chính xác giả",
];

function Track() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 text-[12px] font-medium uppercase tracking-[0.18em] text-white">{t}</span>
          <span className="text-signal-lime" aria-hidden>✦</span>
        </span>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <div className="overflow-hidden bg-brand py-3.5" role="marquee" aria-label="Điểm nổi bật của sản phẩm">
      <div className="animate-ticker flex w-max">
        <Track />
        <Track />
      </div>
    </div>
  );
}
