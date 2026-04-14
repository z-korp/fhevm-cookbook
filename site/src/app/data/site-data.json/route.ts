import { getSiteData } from "@/data/public-artifacts";

export const dynamic = "force-static";

export async function GET() {
  return new Response(JSON.stringify(getSiteData(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
