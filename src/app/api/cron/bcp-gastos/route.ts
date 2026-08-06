import { procesarCorreosBcp } from "@/lib/gmail/process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return ejecutar(req);
}

export async function POST(req: Request) {
  return ejecutar(req);
}

async function ejecutar(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultado = await procesarCorreosBcp();
    return Response.json(resultado);
  } catch (error) {
    console.error("Error en cron bcp-gastos:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
