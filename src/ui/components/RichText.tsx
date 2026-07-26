import React from "react";

// Minimal, controlled renderer for assistant replies — premium, no exposed
// markdown syntax, no em-dash. Handles **bold**, "- " bullets, "|" tables →
// "·" rows, and strips "#" heading marks. The agent is told to keep it light;
// this is the safety net so nothing ever leaks as raw `#`/`*`/`|`.

function inline(s: string): React.ReactNode {
  const clean = s.replace(/—/g, " ").replace(/[ \t]{2,}/g, " ").trim();
  const parts = clean.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{p.replace(/\*/g, "")}</React.Fragment>
    ),
  );
}

export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (!bullets.length) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={`u${blocks.length}`} className="my-1 space-y-1">
        {items.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[2px] text-brand">·</span>
            <span className="flex-1">{inline(b)}</span>
          </li>
        ))}
      </ul>,
    );
  };

  for (const raw of lines) {
    const line = raw.replace(/^#+\s*/, "").trim();
    if (!line) {
      flush();
      continue;
    }
    // table row → readable "·"-joined line (drop separator rows)
    if (line.includes("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length && cells.every((c) => /^[-:\s]+$/.test(c))) continue;
      flush();
      blocks.push(<p key={`t${blocks.length}`} className="leading-relaxed">{inline(cells.join(" · "))}</p>);
      continue;
    }
    const m = line.match(/^[-*•]\s+(.*)/);
    if (m) {
      bullets.push(m[1]);
      continue;
    }
    flush();
    blocks.push(<p key={`p${blocks.length}`} className="leading-relaxed">{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}
