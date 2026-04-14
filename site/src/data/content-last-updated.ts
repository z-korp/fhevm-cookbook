import "server-only";

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_PATHS = ["site/src", "skills"];
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function parseGitDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function readLatestContentUpdate() {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

  try {
    const output = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...CONTENT_PATHS], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return parseGitDate(output) ?? null;
  } catch {
    return null;
  }
}

const latestContentUpdate = readLatestContentUpdate() ?? new Date();

export const CONTENT_LAST_UPDATED_DATE = latestContentUpdate;
export const CONTENT_LAST_UPDATED_LABEL = DATE_FORMATTER.format(latestContentUpdate);
export const CONTENT_LAST_UPDATED_ISO = latestContentUpdate.toISOString().slice(0, 10);
