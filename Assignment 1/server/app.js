import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateQuoteInput } from '../shared/quoteInput.js';
import { calculateQuote } from './pricing.js';

const columns = [
  'customer_name', 'cover_type', 'applicant1_age', 'applicant1_cover_history',
  'applicant2_age', 'applicant2_cover_history', 'hospital_cover', 'extras_cover',
  'payment_frequency', 'annual_discount', 'notes',
];
const frontendPath = fileURLToPath(new URL('../dist/', import.meta.url));

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  const all = db.prepare('SELECT * FROM quotes ORDER BY id DESC');
  const get = db.prepare('SELECT * FROM quotes WHERE id = ?');
  const insert = db.prepare(`INSERT INTO quotes (${columns.join(', ')}) VALUES (${columns.map(c => `@${c}`).join(', ')})`);
  const update = db.prepare(`UPDATE quotes SET ${columns.map(c => `${c} = @${c}`).join(', ')} WHERE id = @id`);
  const remove = db.prepare('DELETE FROM quotes WHERE id = ?');
  const view = row => ({ ...row, breakdown: calculateQuote(row) });
  const router = express.Router();

  router.param('id', (req, res, next, value) => {
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      return res.status(400).json({ error: 'Validation failed', fields: { id: 'Quote ID must be a positive integer.' } });
    }
    req.quote = get.get(Number(value));
    if (!req.quote) return res.status(404).json({ error: 'Quote not found' });
    next();
  });
  const validate = (req, res, next) => {
    const { input, errors } = validateQuoteInput(req.body);
    if (!input) return res.status(400).json({ error: 'Validation failed', fields: errors });
    req.input = input;
    next();
  };

  router.get('/', (req, res) => res.json({ quotes: all.all().map(view) }));
  router.post('/', validate, (req, res) => {
    const id = Number(insert.run(req.input).lastInsertRowid);
    res.location(`/api/quotes/${id}`).status(201).json(view(get.get(id)));
  });
  router.get('/:id', (req, res) => res.json(view(req.quote)));
  router.put('/:id', validate, (req, res) => {
    update.run({ ...req.input, id: req.quote.id });
    res.json(view(get.get(req.quote.id)));
  });
  router.delete('/:id', (req, res) => {
    remove.run(req.quote.id);
    res.status(204).end();
  });
  app.use('/api/quotes', router);
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  if (existsSync(frontendPath + 'index.html')) {
    app.use(express.static(frontendPath));
    app.get('/{*path}', (req, res) => res.sendFile(frontendPath + 'index.html'));
  } else {
    app.get('/{*path}', (req, res) => res.status(503).send('Frontend not built. Run npm run dev:client for development, or npm run build before npm start.'));
  }
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    if (error.status === 413) return res.status(413).json({ error: 'Quote request is too large. Maximum size is 32 KB.' });
    if (error instanceof URIError) return res.status(400).json({ error: 'Invalid URL encoding.' });
    console.error(error);
    res.status(500).json({ error: 'Unable to complete this request. Please try again.' });
  });
  return app;
}
