import { ApiFootballError } from "@/lib/server/api-football";
import { dateInAppTimezone, getFixturesForDate } from "@/lib/server/fixtures";

export async function GET() {
  try {
    return Response.json(await getFixturesForDate(dateInAppTimezone()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof ApiFootballError && error.status === 429 ? 429 : 502;
    const message = error instanceof Error ? error.message : "Unable to load fixtures.";

    return Response.json({ error: message }, { status });
  }
}
