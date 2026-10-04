import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';

const directory = mkdtempSync(join(tmpdir(), 'healthcoversim-test-'));
const filename = join(directory, 'quotes.sqlite');
let db, server, base;
const quote = {
  customer_name: "Jamie O'Connor", cover_type: 'Family',
  applicant1_age: 40, applicant1_cover_history: 'No',
  applicant2_age: 35, applicant2_cover_history: 'Yes',
  hospital_cover: 'Silver', extras_cover: 'Standard',
  payment_frequency: 'Yearly', annual_discount: 5, notes: 'API test',
};
async function start() {
  db = openDatabase(filename);
  server = createApp(db).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}
async function stop() {
  await new Promise(resolve => server.close(resolve));
  db.close();
}
const request = (path = '/api/quotes', method = 'GET', body) => fetch(base + path, {
  method, headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
before(start);
after(async () => { await stop(); rmSync(directory, { recursive: true, force: true }); });

test('CRUD computes current premiums and persists them through a database restart', async () => {
  const created = await request('/api/quotes', 'POST', quote);
  assert.equal(created.status, 201);
  const saved = await created.json();
  assert.equal(created.headers.get('location'), `/api/quotes/${saved.id}`);
  assert.equal(saved.breakdown.yearly_after_discount_cents, 538080);
  assert.equal(saved.customer_name, "Jamie O'Connor");
  const list = await (await request()).json();
  assert.equal(list.quotes[0].id, saved.id);
  const detail = await (await request(`/api/quotes/${saved.id}`)).json();
  assert.equal(detail.breakdown.monthly_premium_cents, 47200);

  const updated = await request(`/api/quotes/${saved.id}`, 'PUT', { ...quote, cover_type: 'Single', payment_frequency: 'Monthly' });
  assert.equal(updated.status, 200);
  const changed = await updated.json();
  assert.equal(changed.applicant2_age, null);
  assert.equal(changed.applicant2_cover_history, null);
  assert.equal(changed.annual_discount, 0);
  assert.equal(changed.breakdown.monthly_premium_cents, 23700);
  assert.equal(changed.breakdown.yearly_after_discount_cents, null);
  assert.equal(changed.created_at, saved.created_at);
  await stop();
  await start();
  const reopened = await (await request(`/api/quotes/${saved.id}`)).json();
  assert.equal(reopened.breakdown.monthly_premium_cents, 23700);
  assert.equal(reopened.created_at, saved.created_at);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get().n, 1);
  assert.equal((await request(`/api/quotes/${saved.id}`, 'DELETE')).status, 204);
  assert.equal((await request(`/api/quotes/${saved.id}`)).status, 404);
  assert.equal((await request()).status, 200);
});

test('invalid API writes cannot create a quote or corrupt an existing quote', async () => {
  const saved = await (await request('/api/quotes', 'POST', quote)).json();
  const count = db.prepare('SELECT count(*) AS n FROM quotes').get().n;
  for (const change of [
    { applicant2_age: null }, { applicant2_cover_history: '' },
    { applicant1_age: 0 }, { applicant1_age: '40' },
    { annual_discount: 11 }, { annual_discount: -1, payment_frequency: 'Monthly' },
    { customer_name: ' ' }, { hospital_cover: 'Platinum' },
  ]) {
    const response = await request('/api/quotes', 'POST', { ...quote, ...change });
    assert.equal(response.status, 400);
    assert.ok(Object.keys((await response.json()).fields).length);
  }
  assert.equal(db.prepare('SELECT count(*) AS n FROM quotes').get().n, count);
  const update = await request(`/api/quotes/${saved.id}`, 'PUT', { ...quote, applicant2_age: null });
  assert.equal(update.status, 400);
  const unchanged = await (await request(`/api/quotes/${saved.id}`)).json();
  assert.equal(unchanged.breakdown.yearly_after_discount_cents, 538080);
});

test('malformed JSON and non-object request bodies return useful 400 errors', async () => {
  const response = await fetch(base + '/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /JSON/i);
  for (const body of [null, [], 'quote']) assert.equal((await request('/api/quotes', 'POST', body)).status, 400);
});
test('invalid ids and unknown API routes do not fall through to the frontend', async () => {
  for (const id of ['abc', '0', '-1', '1.5', '9007199254740992']) {
    assert.equal((await request(`/api/quotes/${id}`)).status, 400);
  }
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await request('/api/quotes/999999', method, method === 'PUT' ? quote : undefined);
    assert.equal(response.status, 404);
  }
  const missing = await request('/api/unknown');
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /json/);
});
test('client-supplied totals are ignored and SQL-looking names are stored as text', async () => {
  const response = await request('/api/quotes', 'POST', { ...quote, customer_name: "Robert'); DROP TABLE quotes;--", breakdown: { monthly_premium_cents: 0 } });
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.equal(saved.customer_name, "Robert'); DROP TABLE quotes;--");
  assert.equal(saved.breakdown.monthly_premium_cents, 47200);
  assert.ok(db.prepare('SELECT count(*) AS n FROM quotes').get().n > 0);
});
