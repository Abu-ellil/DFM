const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('date_factory_v2_2026-02-25_22-20-30.db.sqlite');
  const db = new SQL.Database(buffer);

  // فحص سجل محدد بالتفصيل
  const sample = db.exec('SELECT * FROM weighbridge WHERE id = 523');
  if (sample.length > 0) {
    const row = sample[0].values[0];
    console.log('=== سجل ID 523 بالتفصيل ===');
    console.log('id:', row[0]);
    console.log('date:', row[1]);
    console.log('customer_id:', row[2]);
    console.log('gross_weight:', row[3]);
    console.log('net_weight:', row[4]);
    console.log('price_per_qantar:', row[6]);
    console.log('total:', row[7]);
    console.log('crates_count:', row[8]);
    console.log('commission:', row[11]);
    console.log('');
    console.log('حساب المبلغ:');
    console.log('الحساب البسيط (net_weight * price / 100):', (row[4] * row[6] / 100).toFixed(2));
    console.log('الفرق:', (row[7] - (row[4] * row[6] / 100)).toFixed(2));
    console.log('');

    // هل السعر هو سعر الـ kg بدلاً من قنطار؟
    console.log('لو السعر هو سعر الكيلو:');
    console.log('  (net_weight * price):', (row[4] * row[6]).toFixed(2));

    // هل المبلغ يشمل العمولة؟
    console.log('المبلغ + العمولة:', ((row[4] * row[6] / 100) + row[11]).toFixed(2));
    console.log('');
  }

  // فحص عدة سجلات للبحث عن نمط
  console.log('=== تحليل نمط المبالغ ===');
  const samples = db.exec(`
    SELECT id, net_weight, price_per_qantar, total, commission,
           (total - (net_weight * price_per_qantar / 100)) as diff,
           CASE WHEN price_per_qantar > 0 THEN (total / net_weight) ELSE 0 END as price_per_kg_actual
    FROM weighbridge
    WHERE ABS(total - (net_weight * price_per_qantar / 100)) > 1000
    ORDER BY diff DESC
    LIMIT 10
  `);

  if (samples.length > 0) {
    console.log('ID\tNet Weight\tPrice/Q\tTotal\tDiff\tPrice/KG Actual');
    samples[0].values.forEach(row => {
      console.log(`${row[0]}\t${row[1]}\t\t${row[2]}\t${row[3].toFixed(0)}\t${row[4].toFixed(0)}\t${row[5].toFixed(2)}`);
    });
  }

  // فحص العلاقة بين price_per_qantar والقيم الفعلية
  console.log('\n=== تحليل طريقة الحساب ===');
  const analysis = db.exec(`
    SELECT
      COUNT(*) as count,
      AVG(price_per_qantar) as avg_price_qantar,
      AVG(total / net_weight * 100) as avg_actual_price_qantar,
      AVG(price_per_qantar / total * net_weight * 100) as ratio
    FROM weighbridge
    WHERE net_weight > 0 AND total > 0
  `);

  if (analysis.length > 0) {
    const [count, avgPriceQ, avgActualPriceQ, ratio] = analysis[0].values[0];
    console.log(`عدد السجلات: ${count}`);
    console.log(`متوسط price_per_qantar المسجل: ${avgPriceQ.toFixed(2)}`);
    console.log(`متوسط السعر الفعلي (من total/net_weight*100): ${avgActualPriceQ.toFixed(2)}`);
    console.log(`النسبة: ${ratio.toFixed(4)}`);

    if (Math.abs(ratio - 1) > 0.1) {
      console.log('\n⚠️ هناك فرق كبير بين المسجل والمحسوب!');
      console.log('قد يكون price_per_qantar مخزن كـ "سعر/100قنطار" أو "سعر/كيلو"');
    }
  }
})();
