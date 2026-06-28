import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 config. Replaces the datasource `url` in schema.prisma and the old
 * `package.json#prisma` seed key. CLI commands (migrate, studio, db seed, validate)
 * read their connection + seed command from here. The app runtime connects via the
 * @prisma/adapter-pg driver adapter (see lib/db.ts).
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
