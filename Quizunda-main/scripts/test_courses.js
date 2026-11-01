const db = require('../src/backend/db');

async function test() {
  const [rows] = await db.query('SELECT id, title, price, duration, country FROM courses LIMIT 10');
  console.log('Sample courses:', rows);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });

