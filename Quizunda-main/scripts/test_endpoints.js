const db = require('../src/backend/db');

async function testBackend() {
  console.log('--- Testando Queries de Backend Admin ---');
  // 1. Dashboard stats
  const [coursesCount] = await db.query('SELECT count(*) FROM courses');
  const [usersCount] = await db.query('SELECT count(*) FROM users');
  const [modulesCount] = await db.query('SELECT count(*) FROM course_modules');
  const [categories] = await db.query('SELECT * FROM categories');
  const [settings] = await db.query('SELECT * FROM platform_settings');

  console.log('Courses count:', coursesCount[0].count);
  console.log('Users count:', usersCount[0].count);
  console.log('Modules count:', modulesCount[0].count);
  console.log('Categories:', categories.map(c => c.name));
  console.log('Platform settings name:', settings[0]?.platform_name);
  console.log('✅ Tudo OK na camada de dados do backend!');
  process.exit(0);
}

testBackend().catch(e => {
  console.error(e);
  process.exit(1);
});

