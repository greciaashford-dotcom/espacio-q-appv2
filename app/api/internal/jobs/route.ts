import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { processDueJobsAndCampaigns } from "@/lib/jobs/worker";
import { syncScheduleWithGoogle } from "@/lib/integrations/google";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || cronSecret.length < 16) {
    return NextResponse.json(
      { error: "CRON_SECRET no está configurado." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const expected = `Bearer ${cronSecret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const syncGoogle = url.searchParams.get("syncGoogle") === "1";

  const jobStats = await processDueJobsAndCampaigns({
    nowUtc: new Date(),
    batchSize: 50,
  });

  const googleSync = syncGoogle ? await syncScheduleWithGoogle() : null;

  return NextResponse.json(
    {
      ok: true,
      processedAt: new Date().toISOString(),
      jobStats,
      googleSync,
    },
    { status: 200 }
  );
}
