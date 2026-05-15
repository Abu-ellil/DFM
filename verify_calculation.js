const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('date_factory_v2_2026-02-25_22-20-30.db.sqlite');
  const db = new SQL.Database(buffer);

  console.log('=== التحقق من طريقة الحساب ===\n');

  // النظرية: price_per_qantar هو سعر القنطار (45كجم)
  // والمبلغ محسوب كـ: net_weight * (price_per_qantar / 45)
  // أي: net_weight * price_per_kg

  const test = db.exec(`
    SELECT
      id,
      net_weight,
      price_per_qantar,
      total,
      (price_per_qantar / 45) as price_per_kg,
      (net_weight * (price_per_qantar / 45)) as calculated_total_v1,
      ABS(total - (net_weight * (price_per_qantar / 45))) as diff_v1,
      (net_weight * price_per_qantar / 100) as calculated_total_old_way,
      ABS(total - (net_weight * price_per_qantar / 100)) as diff_old_way
    FROM weighbridge
    LIMIT 5
  `);

  if (test.length > 0) {
    console.log('ID\tNet W\tPrice/Q\tTotal\tCalc(v1)\tDiff(v1)\tDiff(old)');
    test[0].values.forEach(row => {
      const [id, netW, priceQ, total, priceKg, calcV1, diffV1, calcOld, diffOld] = row;
      console.log(`${id}\t${netW}\t${priceQ.toFixed(0)}\t${total.toFixed(0)}\t${calcV1.toFixed(0)}\t${diffV1.toFixed(2)}\t${diffOld.toFixed(0)}`);
    });

    console.log('\nإذا كان Diff(v1) ≈ 0، فهذا يعني أن الحساب الصحيح هو:');
    console.log('total = net_weight * (price_per_qantar / 45)');
    console.log('أي أن price_per_qantar هو سعر القنتبار (45كجم)');
  }

  // فحص جميع السجلات
  console.log('\n=== فحص جميع السجلات ===\n');

  const allCheck = db.exec(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ABS(total - (net_weight * (price_per_qantar / 45))) < 1 THEN 1 ELSE 0 END) as match_v1,
      SUM(CASE WHEN ABS(total - (net_weight * price_per_qantar / 100)) < 1 THEN 1 ELSE 0 END) as match_old
    FROM weighbridge
    WHERE net_weight > 0 AND total > 0
  `);

  if (allCheck.length > 0) {
    const [total, matchV1, matchOld] = allCheck[0].values[0];
    console.log(`عدد السجلات الكلي: ${total}`);
    console.log(`مطابقة للحساب الجديد (price/45): ${matchV1}`);
    console.log(`مطابقة للحساب القديم (price/100): ${matchOld}`);

    if (matchV1 > matchOld) {
      console.log('\n✅ الحساب الصحيح هو: total = net_weight * (price_per_qantar / 45)');
      console.log('   أي أن price_per_qantar هو سعر القنطار (45كجم)');
    }
  }

  // ما هي القيم الشائعة لـ price_per_qantar؟
  console.log('\n=== القيم الشائعة لـ price_per_qantar ===\n');

  const prices = db.exec(`
    SELECT price_per_qantar, COUNT(*) as count
    FROM weighbridge
    GROUP BY price_per_qantar
    ORDER BY count DESC
    LIMIT 10
  `);

  if (prices.length > 0) {
    console.log('Price/Q\tCount\tPrice/KG (÷45)');
    prices[0].values.forEach(row => {
      const [price, count] = row;
      console.log(`${price.toFixed(0)}\t${count}\t${(price / 45).toFixed(2)}`);
    });
  }
})();
