const db = require('../src/backend/db');

async function test() {
  const [rows] = await db.query('SELECT id, name, accountType, role, emailOrPhone FROM users LIMIT 10');
  console.log('Sample users:', rows);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });

