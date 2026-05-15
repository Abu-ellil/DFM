const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('date_factory_v2_2026-02-25_22-20-30.db.sqlite');
  const db = new SQL.Database(buffer);

  // Check weighbridge dates
  const wbDates = db.exec('SELECT id, date, customer_id FROM weighbridge ORDER BY date ASC LIMIT 20');
  console.log('--- أول 20 سجل weighbridge حسب التاريخ ---');
  wbDates[0].values.forEach(v => console.log('ID:', v[0], 'Date:', v[1], 'Customer ID:', v[2]));
  console.log('');

  // Check last dates
  const wbDatesLast = db.exec('SELECT id, date, customer_id FROM weighbridge ORDER BY date DESC LIMIT 10');
  console.log('--- آخر 10 سجلات weighbridge حسب التاريخ ---');
  wbDatesLast[0].values.forEach(v => console.log('ID:', v[0], 'Date:', v[1], 'Customer ID:', v[2]));
  console.log('');

  // Check created_at dates vs actual dates
  const wbCreated = db.exec('SELECT id, date, created_at FROM weighbridge WHERE date LIKE "2015%" OR date LIKE "2016%" OR date LIKE "2017%" OR date LIKE "2018%" LIMIT 10');
  if (wbCreated.length > 0) {
    console.log('--- سجلات ب تواريخ قديمة (قبل 2020) ---');
    wbCreated[0].values.forEach(v => console.log('ID:', v[0], 'Date:', v[1], 'Created:', v[2]));
  } else {
    console.log('--- لا توجد سجلات ب تواريخ قديمة ---');
  }
})();
