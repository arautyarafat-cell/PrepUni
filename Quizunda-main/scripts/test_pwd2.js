const bcrypt = require('bcryptjs');

async function test() {
  const hash2 = '$2b$10$zAxEsOjA131VOB9jGHrVvuGyzUsouzXYUVcQjcn3cduK4mD7Wqkly';
  const candidates = ['admin', 'admin2', 'admin123', '123456', '12345678', '1234', 'prepuni', 'prepuni2026', 'password', 'root', 'admin@123', 'admin#2', '804455', 'yoR99pBhNzNtzwayXhEZ'];
  for (const c of candidates) {
    if (await bcrypt.compare(c, hash2)) {
      console.log('MATCH FOUND FOR ADMIN2:', c);
      return;
    }
  }
  console.log('No match for admin2');
}
test();

