import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lean, self-contained server build for the production Docker image (`node server.js`).
  output: "standalone",
  // Pin the file-tracing root to this project (a stray lockfile in $HOME otherwise
  // makes Next infer the wrong workspace root).
  outputFileTracingRoot: path.join(__dirname),
  // The default-menu seeder reads photo files from disk at runtime (lib/seed/item_images/*.png).
  // Trace them into a standalone build so the super-admin seed action works in prod, not just dev.
  outputFileTracingIncludes: {
    "/cafes": ["./lib/seed/data.json", "./lib/seed/item_images/**"],
  },
  // Keep the Postgres driver (used by the Prisma 7 driver adapter in lib/db.ts) as a
  // server external — it must not be bundled into the RSC/server build.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  // The custom imgproxy image loader is wired in the image-pipeline phase.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
