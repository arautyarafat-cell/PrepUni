const db = require('../src/backend/db');

async function main() {
  const [cols] = await db.query(
    "SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'courses'"
  );
  console.log(cols);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
