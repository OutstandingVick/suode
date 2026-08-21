import { hasApiFootballKey } from "@/lib/server/env";

export async function GET() {
  return Response.json(
    {
      apiFootball: {
        configured: hasApiFootballKey(),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
