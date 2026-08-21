import { ApiFootballError } from "@/lib/server/api-football";
import { dateInAppTimezone, getFixturesForDate } from "@/lib/server/fixtures";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  try {
    const requestedDate = new URL(request.url).searchParams.get("date");
    const date = requestedDate ?? dateInAppTimezone();

    if (!DATE_PATTERN.test(date)) {
      return Response.json({ error: "Date must use the YYYY-MM-DD format." }, { status: 400 });
    }

    return Response.json(await getFixturesForDate(date), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof ApiFootballError && error.status === 429 ? 429 : 502;
    const message = error instanceof Error ? error.message : "Unable to load fixtures.";

    return Response.json({ error: message }, { status });
  }
}
