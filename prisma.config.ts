import { defineConfig } from "prisma/config";
import "dotenv/config";

// DATABASE_URL is only needed at runtime (migrate/push), not during generate.
// Vercel sets it as an env var; locally it comes from .env via Next.js.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
