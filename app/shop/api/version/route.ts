// The shop page polls this every 10 seconds. A new value means a new version is live, so phones reload.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

function buildId(): string {
  try {
    return readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    return "dev";
  }
}

const VERSION = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || buildId();

export function GET() {
  return Response.json({ version: VERSION }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
