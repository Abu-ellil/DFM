const initSqlJs = require('sql.js');
const fs = require('fs');
const xlsx = require('xlsx');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('date_factory_v2_2026-02-25_22-20-30.db.sqlite');
  const db = new SQL.Database(buffer);

  const workbook = xlsx.utils.book_new();

  // Helper function to add sheet
  const addSheet = (name, query) => {
    try {
      const result = db.exec(query);
      if (result.length > 0) {
        const ws = xlsx.utils.aoa_to_sheet([
          result[0].columns,
          ...result[0].values.map(row =>
            row.map(cell => (cell === null ? '' : cell))
          )
        ]);
        xlsx.utils.book_append_sheet(workbook, ws, name.substring(0, 31)); // Excel sheet name max 31 chars
        console.log(`Added sheet: ${name} (${result[0].values.length} rows)`);
      }
    } catch (e) {
      console.log(`Error adding ${name}:`, e.message);
    }
  };

  console.log('=== تصدير البيانات إلى Excel ===');
  console.log('');

  // Add sheets with main data
  addSheet('customers', 'SELECT * FROM customers ORDER BY id');
  addSheet('weighbridge', `
    SELECT w.id, w.date, c.name as customer_name,
      w.gross_weight, w.net_weight, w.price_per_qantar,
      w.total, w.crates_count, w.commission, w.notes
    FROM weighbridge w
    LEFT JOIN customers c ON w.customer_id = c.id
    ORDER BY w.date DESC, w.id DESC
  `);
  addSheet('finance', `
    SELECT f.id, f.date, c.name as customer_name,
      f.transaction_type, f.amount_paid, f.amount_received,
      f.payment_method, f.notes
    FROM finance f
    LEFT JOIN customers c ON f.customer_id = c.id
    ORDER BY f.date DESC, f.id DESC
  `);
  addSheet('crates', `
    SELECT cr.id, cr.date, c.name as customer_name,
      cr.crates_out, cr.crates_returned, cr.handler, cr.notes
    FROM crates cr
    LEFT JOIN customers c ON cr.customer_id = c.id
    ORDER BY cr.date DESC, cr.id DESC
  `);
  addSheet('crate_types', 'SELECT * FROM crate_types');
  addSheet('date_types', 'SELECT * FROM date_types');
  addSheet('supervisors', 'SELECT * FROM supervisors');

  // Summary statistics sheet
  const summary = [
    ['=== ملخص البيانات ===', ''],
    ['', ''],
    ['--- الوزن (Weighbridge) ---', ''],
    ['عدد السجلات', db.exec('SELECT COUNT(*) FROM weighbridge')[0].values[0][0]],
    ['مجموع الوزن الصافي (kg)', db.exec('SELECT SUM(net_weight) FROM weighbridge')[0].values[0][0]],
    ['مجموع المبالغ (ج.م)', db.exec('SELECT SUM(total) FROM weighbridge')[0].values[0][0]],
    ['مجموع العمولات (ج.م)', db.exec('SELECT SUM(commission) FROM weighbridge')[0].values[0][0]],
    ['', ''],
    ['--- المالية (Finance) ---', ''],
    ['عدد السجلات', db.exec('SELECT COUNT(*) FROM finance')[0].values[0][0]],
    ['مجموع المدفوعات (ج.م)', db.exec('SELECT SUM(amount_paid) FROM finance')[0].values[0][0]],
    ['مجموع المستحقات (ج.م)', db.exec('SELECT SUM(amount_received) FROM finance')[0].values[0][0]],
    ['', ''],
    ['--- الصناديق (Crates) ---', ''],
    ['عدد السجلات', db.exec('SELECT COUNT(*) FROM crates')[0].values[0][0]],
    ['مجموع الصناديق الصادرة', db.exec('SELECT SUM(crates_out) FROM crates')[0].values[0][0]],
    ['مجموع الصناديق المسترجعة', db.exec('SELECT SUM(crates_returned) FROM crates')[0].values[0][0]],
    ['', ''],
    ['--- العملاء (Customers) ---', ''],
    ['عدد العملاء', db.exec('SELECT COUNT(*) FROM customers')[0].values[0][0]],
    ['تاجر', db.exec('SELECT COUNT(*) FROM customers WHERE type="تاجر"')[0].values[0][0]],
    ['عميل عادي', db.exec('SELECT COUNT(*) FROM customers WHERE type="عميل عادي"')[0].values[0][0]],
    ['', ''],
    ['--- نطاق التواريخ ---', ''],
    ['أول تاريخ', db.exec('SELECT MIN(date) FROM weighbridge')[0].values[0][0]],
    ['آخر تاريخ', db.exec('SELECT MAX(date) FROM weighbridge')[0].values[0][0]],
  ];
  const wsSummary = xlsx.utils.aoa_to_sheet(summary);
  xlsx.utils.book_append_sheet(workbook, wsSummary, 'Summary');

  // Save file
  const outputFile = 'D:/DEV/DateS/LATEST/DFM/data_export_' + new Date().toISOString().slice(0,10) + '.xlsx';
  xlsx.writeFile(workbook, outputFile);
  console.log('');
  console.log(`=== تم تصدير البيانات إلى: ${outputFile} ===`);
})();
