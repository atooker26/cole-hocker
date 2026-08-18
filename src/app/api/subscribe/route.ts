import { NextRequest } from "next/server";
import { z } from "zod";
import { addSubscriber } from "@/lib/subscribe";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(320),
  // Honeypot — bots fill hidden fields, humans leave them empty.
  _hp: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Silently accept honeypot hits so bots get no signal.
  if (parsed.data._hp) return Response.json({ ok: true });

  const result = await addSubscriber(parsed.data.email, ["site-signup"]);
  if (!result.ok) {
    return Response.json({ error: "Could not sign you up. Try again." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
