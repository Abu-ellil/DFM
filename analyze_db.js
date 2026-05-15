const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('date_factory_v2_2026-02-25_22-20-30.db.sqlite');
  const db = new SQL.Database(buffer);

  console.log('=== ملخص البيانات ===');
  console.log('');

  // Weighbridge summary
  const wb = db.exec('SELECT COUNT(*) as count, SUM(net_weight) as total_weight, SUM(total) as total_amount, SUM(commission) as total_commission FROM weighbridge');
  console.log('--- الوزن (Weighbridge) ---');
  console.log('عدد السجلات:', wb[0].values[0][0]);
  console.log('مجموع الوزن الصافي (kg):', wb[0].values[0][1]);
  console.log('مجموع المبالغ (ج.م):', wb[0].values[0][2]);
  console.log('مجموع العمولات (ج.م):', wb[0].values[0][3]);
  console.log('');

  // Finance summary
  const fin = db.exec('SELECT COUNT(*) as count, SUM(amount_paid) as paid, SUM(amount_received) as received FROM finance');
  console.log('--- المالية (Finance) ---');
  console.log('عدد السجلات:', fin[0].values[0][0]);
  console.log('مجموع المدفوعات (ج.م):', fin[0].values[0][1]);
  console.log('مجموع المستحقات (ج.م):', fin[0].values[0][2]);
  console.log('');

  // Crates summary
  const cr = db.exec('SELECT COUNT(*) as count, SUM(crates_out) as out, SUM(crates_returned) as returned FROM crates');
  console.log('--- الصناديق (Crates) ---');
  console.log('عدد السجلات:', cr[0].values[0][0]);
  console.log('مجموع الصناديق الصادرة:', cr[0].values[0][1]);
  console.log('مجموع الصناديق المسترجعة:', cr[0].values[0][2]);
  console.log('الصناديق المتبقية عند العملاء:', (cr[0].values[0][1] - cr[0].values[0][2]));
  console.log('');

  // Customers by type
  const cust = db.exec('SELECT type, COUNT(*) as count FROM customers GROUP BY type');
  console.log('--- العملاء (Customers) ---');
  cust[0].values.forEach(v => console.log(v[0], ':', v[1]));
  console.log('');

  // Date range
  const dates = db.exec('SELECT MIN(date) as min_date, MAX(date) as max_date FROM weighbridge');
  console.log('--- نطاق التواريخ ---');
  console.log('من:', dates[0].values[0][0]);
  console.log('إلى:', dates[0].values[0][1]);
  console.log('');

  // Top customers by weighbridge amount
  const top = db.exec(`
    SELECT c.name, COUNT(*) as trips, SUM(w.net_weight) as total_weight, SUM(w.total) as total_amount
    FROM weighbridge w
    JOIN customers c ON w.customer_id = c.id
    GROUP BY c.id
    ORDER BY total_amount DESC
    LIMIT 10
  `);
  console.log('--- أعلى 10 عملاء حسب المبالغ ---');
  top[0].values.forEach((v, i) => {
    console.log(`${i+1}. ${v[0]} - ${v[1]} رحلة - وزن: ${v[2].toFixed(0)}kg - مبلغ: ${v[3].toFixed(2)} ج.م`);
  });
})();
