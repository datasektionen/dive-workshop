import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://user:pass@localhost:5432/dive?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
});
