const bcrypt = require('bcryptjs');
const db = require('../src/backend/db');

async function test() {
  const [rows] = await db.query('SELECT * FROM admin');
  console.log('Admins in DB:', rows);
  for (const row of rows) {
    const is123456 = await bcrypt.compare('123456', row.password);
    const isAdmin = await bcrypt.compare('admin', row.password);
    const isAdmin1 = await bcrypt.compare('admin1', row.password);
    console.log(`User: ${row.username} | 123456: ${is123456} | admin: ${isAdmin} | admin1: ${isAdmin1}`);
  }
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });

