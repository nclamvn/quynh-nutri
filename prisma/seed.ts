// DB seed — maps the canonical TS seed (src/data/seed/*) into Postgres.
// Runs only once a real DB is wired (DATABASE_URL + adapter). Phase 1 dev serves
// the same TS seed in-memory, so this is the persistence bootstrap, not a dev dep.
//
//   npm run db:seed   (after `prisma db push` against a provisioned Postgres)

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { COMMODITIES } from "../src/data/seed/commodity";
import { REPERTOIRE } from "../src/data/seed/repertoire";
import { DEFAULT_HOUSEHOLD } from "../src/data/seed/household";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // A — commodities
  for (const c of COMMODITIES) {
    await prisma.commodityIngredient.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        canonicalVn: c.canonicalVn,
        labelEn: c.labelEn,
        group: c.group,
        kcal: c.kcal,
        proteinG: c.proteinG,
        carbG: c.carbG,
        fatG: c.fatG,
        fiberG: c.fiberG,
        provenanceLevel: c.provenanceLevel,
        confidence: c.confidence,
        sourceRefs: c.sourceRefs,
        seasonMonths: c.seasonMonths ?? [],
        storageNote: c.storageNote,
        substitutes: c.substitutes ?? [],
      },
    });
  }

  // B0 — repertoire
  for (const d of REPERTOIRE) {
    await prisma.repertoireDish.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        vnName: d.vnName,
        enLabel: d.enLabel,
        proteinType: d.proteinType,
        method: d.method,
        slot: d.slot,
        quick: d.quick,
        baseServings: d.baseServings,
        prepAhead: d.prepAhead ?? [],
        cookTimeMin: d.cookTimeMin,
        tags: d.tags ?? [],
        lines: {
          create: d.lines.map((l) => ({
            commodityId: l.commodityId,
            qtyBase: l.qtyBase,
            unit: l.unit,
          })),
        },
      },
    });
  }

  // Default household (P0)
  const hh = DEFAULT_HOUSEHOLD;
  await prisma.household.upsert({
    where: { id: hh.id },
    update: {},
    create: {
      id: hh.id,
      name: hh.name,
      size: hh.size,
      marketMode: hh.marketMode,
      cookTimeCapMin: hh.cookTimeCapMin,
      busyDays: hh.busyDays,
      lactatingMember: hh.lactatingMember,
      members: { create: hh.members.map((m) => ({ role: m.role, sex: m.sex, ageBand: m.ageBand, activity: m.activity })) },
    },
  });

  console.log(`Seeded ${COMMODITIES.length} commodities, ${REPERTOIRE.length} dishes, 1 household.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
