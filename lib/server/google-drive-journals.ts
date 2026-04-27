import { google } from "googleapis";
import type { CloudJournalEntry } from "@/lib/domain/types";

const FILE_NAME = "mind-canvas-journals.json";

function driveClient(refreshToken: string) {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) return null;
  const oauth2 = new google.auth.OAuth2(id, secret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oauth2 });
}

async function findFileId(drive: ReturnType<typeof google.drive>, name: string): Promise<string | null> {
  const res = await drive.files.list({
    spaces: "appDataFolder",
    q: `name='${name.replace(/'/g, "\\'")}' and trashed=false`,
    fields: "files(id,name)",
    pageSize: 1,
  });
  return res.data.files?.[0]?.id ?? null;
}

export async function readJournalsFromDrive(refreshToken: string): Promise<CloudJournalEntry[] | null> {
  try {
    const drive = driveClient(refreshToken);
    if (!drive) return null;
    const fileId = await findFileId(drive, FILE_NAME);
    if (!fileId) return [];
    const buf = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
    const text = Buffer.from(buf.data as ArrayBuffer).toString("utf-8");
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is CloudJournalEntry =>
        e &&
        typeof e === "object" &&
        typeof (e as CloudJournalEntry).id === "string" &&
        typeof (e as CloudJournalEntry).body === "string"
    );
  } catch {
    return null;
  }
}

export async function writeJournalsToDrive(
  refreshToken: string,
  entries: CloudJournalEntry[]
): Promise<boolean> {
  try {
    const drive = driveClient(refreshToken);
    if (!drive) return false;
    const body = Buffer.from(JSON.stringify(entries, null, 2), "utf-8");
    const fileId = await findFileId(drive, FILE_NAME);
    const media = { mimeType: "application/json", body };
    if (fileId) {
      await drive.files.update({ fileId, media, supportsAllDrives: false });
    } else {
      await drive.files.create({
        requestBody: { name: FILE_NAME, parents: ["appDataFolder"] },
        media,
        fields: "id",
      });
    }
    return true;
  } catch {
    return false;
  }
}
