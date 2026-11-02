import fs from "node:fs";
import { createClient } from "@libsql/client";
// @ts-ignore plain ESM module without types
import { applyMigrations } from "../../scripts/migrate.mjs";

export default async function setup(ctx: { config: { env?: Record<string, string> } }) {
  const url = ctx.config.env?.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) throw new Error("tests need a file: DATABASE_URL");
  const file = url.slice("file:".length);
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.unlinkSync(file + suffix);
    } catch {
      // nothing to clean
    }
  }
  const client = createClient({ url });
  await applyMigrations(client);
  client.close();
  return () => {
    for (const suffix of ["", "-wal", "-shm"]) {
      try {
        fs.unlinkSync(file + suffix);
      } catch {
        // already gone
      }
    }
  };
}
