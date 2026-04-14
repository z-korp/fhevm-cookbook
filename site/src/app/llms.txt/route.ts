import { getLlmsText } from "@/data/public-artifacts";

export const dynamic = "force-static";

export async function GET() {
  return new Response(getLlmsText(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
