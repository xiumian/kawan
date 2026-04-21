import "dotenv/config";

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = process.env.DATABASE_URL;
const prismaCliPath = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");

if (!databaseUrl?.startsWith("file:")) {
  throw new Error("DATABASE_URL 必须是 SQLite file: 协议");
}

const sqlitePath = resolveSqlitePath(databaseUrl);
mkdirSync(path.dirname(sqlitePath), { recursive: true });
const fromArgs = existsSync(sqlitePath)
  ? ["--from-config-datasource"]
  : ["--from-empty"];

const sql = execFileSync(
  process.execPath,
  [
    prismaCliPath,
    "migrate",
    "diff",
    ...fromArgs,
    "--to-schema",
    "prisma/schema.prisma",
    "--script",
  ],
  {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  },
);

const database = new Database(sqlitePath);
database.exec(sql);
database.close();

function resolveSqlitePath(url: string) {
  const rawPath = url.slice("file:".length);

  if (/^\/[A-Za-z]:\//.test(rawPath)) {
    return rawPath.slice(1);
  }

  if (/^[A-Za-z]:\//.test(rawPath)) {
    return rawPath;
  }

  return path.resolve(projectRoot, rawPath);
}
