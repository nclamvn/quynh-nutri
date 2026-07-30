import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const ROOTS = ["src", "public"];
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".webmanifest",
]);
const FORBIDDEN = "—";

async function textFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return textFiles(path);
      return TEXT_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
    }),
  );
  return nested.flat();
}

const files = (await Promise.all(ROOTS.map(textFiles))).flat();
const violations = [];

for (const file of files) {
  const lines = (await readFile(file, "utf8")).split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes(FORBIDDEN)) {
      violations.push(`${relative(process.cwd(), file)}:${index + 1}`);
    }
  });
}

if (violations.length > 0) {
  console.error(
    `Typography policy failed: replace em dash (${FORBIDDEN}) with en dash (–):\n${violations.join("\n")}`,
  );
  process.exit(1);
}

console.log(`Typography policy passed across ${files.length} source files.`);
