/**
 * Seed: one plan, one café, an owner + a staff user, and a small menu (categories + items).
 * Gives every later phase real data to build against. Idempotent — safe to re-run.
 *
 * Runs via `pnpm db:seed` (configured under "prisma".seed in package.json). Uses its own
 * PrismaClient (the app's lib/db.ts is `server-only` and can't be imported into a node script).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CafeRole, MenuTemplate } from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const plan = await prisma.plan.upsert({
    where: { id: "plan_free" },
    update: {},
    create: { id: "plan_free", name: "Free" },
  });

  const cafe = await prisma.cafe.upsert({
    where: { slug: "darya" },
    update: {},
    create: {
      slug: "darya",
      name: "کافه دریا",
      template: MenuTemplate.EDITORIAL,
      planId: plan.id,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@darya.cafe" },
    update: {},
    create: {
      email: "owner@darya.cafe",
      name: "مالک دریا",
      passwordHash: hashPassword("password123"),
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@darya.cafe" },
    update: {},
    create: {
      email: "staff@darya.cafe",
      name: "کارمند دریا",
      passwordHash: hashPassword("password123"),
    },
  });

  await prisma.membership.upsert({
    where: { cafeId_userId: { cafeId: cafe.id, userId: owner.id } },
    update: { role: CafeRole.OWNER },
    create: { cafeId: cafe.id, userId: owner.id, role: CafeRole.OWNER },
  });

  await prisma.membership.upsert({
    where: { cafeId_userId: { cafeId: cafe.id, userId: staff.id } },
    update: { role: CafeRole.STAFF },
    create: { cafeId: cafe.id, userId: staff.id, role: CafeRole.STAFF },
  });

  // A super-admin platform operator (no café membership needed).
  await prisma.user.upsert({
    where: { email: "admin@platform.local" },
    update: { platformRole: "SUPER_ADMIN" },
    create: {
      email: "admin@platform.local",
      name: "Platform Operator",
      platformRole: "SUPER_ADMIN",
      passwordHash: hashPassword("password123"),
    },
  });

  const menu: Array<{
    slug: string;
    name: { fa: string; en: string };
    items: Array<{ name: { fa: string; en: string }; calories?: number }>;
  }> = [
    {
      slug: "hot",
      name: { fa: "نوشیدنی گرم", en: "Hot Drinks" },
      items: [
        { name: { fa: "اسپرسو", en: "Espresso" }, calories: 5 },
        { name: { fa: "کاپوچینو", en: "Cappuccino" }, calories: 120 },
        { name: { fa: "لاته", en: "Latte" }, calories: 190 },
      ],
    },
    {
      slug: "cold",
      name: { fa: "نوشیدنی سرد", en: "Cold Drinks" },
      items: [
        { name: { fa: "آیس لاته", en: "Iced Latte" }, calories: 130 },
        { name: { fa: "آب پرتقال", en: "Orange Juice" }, calories: 110 },
      ],
    },
    {
      slug: "desserts",
      name: { fa: "دسر", en: "Desserts" },
      items: [
        { name: { fa: "چیزکیک", en: "Cheesecake" }, calories: 320 },
        { name: { fa: "براونی", en: "Brownie" }, calories: 410 },
      ],
    },
  ];

  for (const [c, category] of menu.entries()) {
    const created = await prisma.category.upsert({
      where: { id: `cat_${cafe.id}_${category.slug}` },
      update: { name: category.name, sortOrder: c },
      create: {
        id: `cat_${cafe.id}_${category.slug}`,
        cafeId: cafe.id,
        name: category.name,
        sortOrder: c,
      },
    });

    for (const [i, item] of category.items.entries()) {
      await prisma.item.upsert({
        where: { id: `item_${created.id}_${i}` },
        update: { name: item.name, calories: item.calories ?? null, sortOrder: i },
        create: {
          id: `item_${created.id}_${i}`,
          cafeId: cafe.id,
          categoryId: created.id,
          name: item.name,
          calories: item.calories ?? null,
          sortOrder: i,
        },
      });
    }
  }

  const counts = {
    cafes: await prisma.cafe.count(),
    users: await prisma.user.count(),
    memberships: await prisma.membership.count(),
    categories: await prisma.category.count(),
    items: await prisma.item.count(),
  };
  console.log("Seed complete:", counts);
  console.log("Logins (password: password123): owner@darya.cafe, staff@darya.cafe, admin@platform.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
