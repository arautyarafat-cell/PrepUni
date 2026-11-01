const bcrypt = require('bcryptjs');

async function test() {
  const hash1 = '$2b$10$BsqhBykt0lZGdTkDqfddO.KXuq5Lz1Sd.UQxJEbrD.1zOw1xAnEua';
  const candidates = ['admin', 'admin1', 'admin123', '123456', '12345678', '1234', 'prepuni', 'prepuni2026', 'password', 'root', 'admin@123', 'admin#1', '804455', 'yoR99pBhNzNtzwayXhEZ'];
  for (const c of candidates) {
    if (await bcrypt.compare(c, hash1)) {
      console.log('MATCH FOUND FOR ADMIN1:', c);
      return;
    }
  }
  console.log('No simple match found');
}
test();

