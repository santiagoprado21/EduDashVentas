import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { fetchSheet, type SheetData } from './sheets';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const TTL_MS = Number(process.env.CACHE_TTL_SECONDS ?? 60) * 1000;

let cache: { data: SheetData; expires: number } | null = null;

app.get('/api/sales', async (req, res) => {
  const sheetId = process.env.SHEET_ID;
  const range = process.env.SHEET_RANGE ?? 'Hoja 1';
  if (!sheetId) {
    res.status(500).json({ error: 'Falta SHEET_ID en .env' });
    return;
  }

  const force = req.query.refresh === '1';
  if (!force && cache && cache.expires > Date.now()) {
    res.json(cache.data);
    return;
  }

  try {
    const data = await fetchSheet(sheetId, range);
    cache = { data, expires: Date.now() + TTL_MS };
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sheets]', message);
    res.status(502).json({ error: message });
  }
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve('dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
});
