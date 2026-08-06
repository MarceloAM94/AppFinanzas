import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const IMAP_HOST = "imap.gmail.com";
const IMAP_PORT = 993;

export interface CredencialesImap {
  user: string;
  pass: string;
}

export interface CorreoBcp {
  messageId: string;
  fecha: Date | null;
  de: string;
  asunto: string;
  texto: string;
  html: string | null;
}

function crearCliente({ user, pass }: CredencialesImap) {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user, pass },
    logger: false,
  });
}

export async function validarConexionImap({ user, pass }: CredencialesImap): Promise<boolean> {
  const client = crearCliente({ user, pass });
  try {
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function obtenerCorreosBcp({
  user,
  pass,
  remitentes,
  desde,
  maximo = 50,
}: CredencialesImap & { remitentes: string[]; desde: Date; maximo?: number }): Promise<CorreoBcp[]> {
  const client = crearCliente({ user, pass });
  await client.connect();

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const query: Record<string, unknown> = {
        or: remitentes.map((from) => ({ from })),
        since: desde,
      };

      const uids = (await client.search(query)) || [];
      const batch = uids.slice(-maximo);
      const correos: CorreoBcp[] = [];

      for (const uid of batch) {
        try {
          const msg = await client.fetchOne(uid, { source: true });
          if (!msg || !msg.source) continue;
          const parsed = await simpleParser(Buffer.from(msg.source));
          correos.push({
            messageId: parsed.messageId || `${uid}@imap`,
            fecha: parsed.date || null,
            de: parsed.from?.text || "",
            asunto: parsed.subject || "",
            texto: parsed.text || "",
            html: parsed.html || null,
          });
        } catch {
          continue;
        }
      }

      return correos;
    } finally {
      await lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}
