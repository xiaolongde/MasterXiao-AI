import { initDatabase } from './server/database/index.js';

const db = await initDatabase();
const r = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='session_match_records'");
console.log('Table schema:', r[0].values[0][0]);
process.exit(0);
