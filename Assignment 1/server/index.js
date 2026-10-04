import { openDatabase } from './db.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be a whole number from 1 to 65535.');
  process.exit(1);
}
const host = process.env.HOST || '127.0.0.1';
const db = openDatabase();
const server = createApp(db).listen(port, host, () => {
  console.log(`HealthCoverSim running at http://${host}:${port}`);
});
server.on('error', error => {
  console.error(`Unable to start HealthCoverSim: ${error.message}`);
  db.close();
  process.exit(1);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => { db.close(); process.exit(0); }));
}
