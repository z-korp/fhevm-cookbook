import { getSkillsSnapshot } from "@/data/public-artifacts";

export const dynamic = "force-static";

export async function GET() {
  return new Response(JSON.stringify(getSkillsSnapshot(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
