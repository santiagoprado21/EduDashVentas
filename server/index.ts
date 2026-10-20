import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { feriasHandler, inventoryHandler, loginHandler, logoutHandler, salesHandler } from './handlers.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json({ limit: '10kb' }));
app.get('/api/sales', salesHandler);
app.get('/api/ferias', feriasHandler);
app.get('/api/inventory', inventoryHandler);
app.post('/api/login', loginHandler);
app.post('/api/logout', logoutHandler);

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve('dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
});
