const bcrypt = require('bcryptjs');
const db = require('./database');

const admins = [
  { name: 'Insurance Officer', email: 'admin@secureclaim.com', password: 'admin123' },
  { name: 'Claims Manager', email: 'manager@secureclaim.com', password: 'manager123' },
];

const insertAdmin = db.prepare(
  'INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
);

for (const admin of admins) {
  const hashed = bcrypt.hashSync(admin.password, 10);
  insertAdmin.run(admin.name, admin.email, hashed, 'admin');
}

console.log('✅ Admin accounts seeded successfully:');
console.log('   admin@secureclaim.com / admin123');
console.log('   manager@secureclaim.com / manager123');
