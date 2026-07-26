import { writeFile, mkdir } from "node:fs/promises";

// WS-1: self-host real food photos (never hotlink at runtime). Source: TheMealDB
// (free food-photo DB, real appetizing photos; Unsplash source-API is deprecated
// + needs a key). Mapped by dish CATEGORY — consistency of tone > exact match.
// SVG fallback (public/dishes/*.svg) stays for anything unmapped/broken.

const OUT = "public/dishes/photos";
// category → search term that yields an on-tone real food photo
const MAP = {
  kho: "braised",
  canh: "ramen", // broth bowl, on-tone (Á)
  rau: "stir fry", // green stir-fry
  com: "fried rice",
  ga: "chicken",
  bo: "beef", // → Beef pho (đúng tông)
  ca: "salmon",
  tom: "prawn", // → Kung Po Prawns
  cua: "crab",
  heo: "pork", // → Tonkatsu
  trung: "egg",
  dau: "tofu", // → Ma Po Tofu
  nuong: "teriyaki", // grilled glazed, Á
  traicay: "mango", // fruit dessert
  man: "curry", // → Thai Green Curry
};

await mkdir(OUT, { recursive: true });
const credits = ["# Dish photos — credits", "", "Source: TheMealDB (https://www.themealdb.com) — free food-photo database.", "Self-hosted (no runtime hotlink). Mapped by category; consistency-of-tone > exact match.", "", "| file | search term | source meal |", "|---|---|---|"];

for (const [cat, term] of Object.entries(MAP)) {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`);
    const data = await res.json();
    const meal = data.meals?.[0];
    if (!meal?.strMealThumb) {
      console.log(`skip ${cat} (${term}) — no result`);
      continue;
    }
    const imgRes = await fetch(`${meal.strMealThumb}/medium`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    await writeFile(`${OUT}/${cat}.jpg`, buf);
    credits.push(`| ${cat}.jpg | ${term} | ${meal.strMeal} |`);
    console.log(`✓ ${cat}.jpg  ${Math.round(buf.length / 1024)}kb  (${meal.strMeal})`);
  } catch (e) {
    console.log(`skip ${cat} — ${e.message}`);
  }
}
await writeFile("public/dishes/CREDITS.md", credits.join("\n") + "\n");
console.log("done → " + OUT);
