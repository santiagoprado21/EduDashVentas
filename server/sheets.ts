import { readFileSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  fetchedAt: string;
}

function loadCredentials(): Record<string, unknown> {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) return JSON.parse(inline);

  const keyFile = process.env.GOOGLE_KEY_FILE;
  if (!keyFile) {
    throw new Error('Falta GOOGLE_KEY_FILE o GOOGLE_SERVICE_ACCOUNT_JSON en .env');
  }
  return JSON.parse(readFileSync(keyFile, 'utf8'));
}

let auth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  auth ??= new GoogleAuth({ credentials: loadCredentials(), scopes: SCOPES });
  return auth;
}

export async function fetchSheet(sheetId: string, range: string): Promise<SheetData> {
  const client = await getAuth().getClient();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}` +
    `/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  const res = await client.request<{ values?: unknown[][] }>({ url });
  const [headerRow = [], ...body] = res.data.values ?? [];
  const headers = headerRow.map((h) => String(h).trim());

  const rows = body
    .filter((r) => r.some((cell) => cell !== '' && cell != null))
    .map((r) =>
      Object.fromEntries(headers.map((h, i) => [h, r[i] == null ? '' : String(r[i])])),
    );

  return { headers, rows, fetchedAt: new Date().toISOString() };
}
