/**
 * سكريبت المراجعة الأولية قبل الاستيراد
 * يتحقق من مشاكل البيانات ويقترح الحلول
 *
 * الاستخدام: node pre_import_review.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const OLD_DB_PATH = path.join(__dirname, 'date_factory_v2_2026-02-25_22-20-30.db.sqlite');

async function main() {
  console.log('=== مراجعة البيانات قبل الاستيراد ===\n');

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(OLD_DB_PATH);
  const db = new SQL.Database(buffer);

  // فحص السيزون النشط في قاعدة البيانات الحالية
  console.log('🔍 فحص السيزون النشط...\n');
  const NEW_DB_PATH = path.join(__dirname, 'date_factory_v2.db');

  let activeSeasonId = null;
  let hasActiveSeason = false;

  if (fs.existsSync(NEW_DB_PATH)) {
    try {
      const newBuffer = fs.readFileSync(NEW_DB_PATH);
      const newDb = new SQL.Database(newBuffer);
      const activeSeason = newDb.exec('SELECT id, name, start_date, end_date FROM seasons WHERE is_active = 1 LIMIT 1');

      if (activeSeason.length > 0 && activeSeason[0].values.length > 0) {
        activeSeasonId = activeSeason[0].values[0][0];
        const seasonName = activeSeason[0].values[0][1];
        const startDate = activeSeason[0].values[0][2];
        const endDate = activeSeason[0].values[0][3];
        hasActiveSeason = true;
        console.log(`✅ السيزون النشط: ${seasonName}`);
        console.log(`   من: ${startDate}`);
        console.log(`   إلى: ${endDate}`);
        console.log(`   ID: ${activeSeasonId}`);
        console.log(`   سيتم ربط جميع البيانات المستوردة بهذا السيزون\n`);
      } else {
        console.log('⚠️ لا يوجد سيزون نشط!');
        console.log('   يُنصح بإنشاء سيزون وتفعيله قبل الاستيراد.');
        console.log('   يمكنك إنشاء سيزون من التطبيق (صفحة المواسم)\n');
      }
    } catch (e) {
      console.log('⚠️ تعذر فحص السيزون النشط:', e.message, '\n');
    }
  } else {
    console.log('ℹ️ قاعدة البيانات الحالية غير موجودة سيتم إنشاؤها\n');
  }

  let issues = [];
  let warnings = [];

  // 1. فحص التواريخ غير الطبيعية
  console.log('🔍 فحص التواريخ...');
  const oldDates = db.exec(`
    SELECT id, date, created_at,
      CASE
        WHEN date < '2020-01-01' THEN 'تاريخ قديم جداً'
        WHEN date > '2026-12-31' THEN 'تاريخ مستقبلي'
        ELSE 'OK'
      END as status
    FROM weighbridge
    WHERE date < '2020-01-01' OR date > '2026-12-31'
    ORDER BY date ASC
  `);

  if (oldDates.length > 0) {
    console.log(`\n⚠️ وجدت ${oldDates[0].values.length} سجل بتاريخ غير طبيعي:`);
    oldDates[0].values.forEach(row => {
      console.log(`   ID ${row[0]}: ${row[1]} (${row[3]}) - تم الإنشاء: ${row[2]}`);
      issues.push({
        table: 'weighbridge',
        id: row[0],
        issue: `تاريخ غير طبيعي: ${row[1]}`,
        suggestion: row[1] < '2020-01-01' ? 'استبعاد أو تصحيح التاريخ' : 'تحقق من صحة التاريخ'
      });
    });
  } else {
    console.log('✅ لا توجد تواريخ غير طبيعية');
  }

  // 2. فحص المراجع المعطلة
  console.log('\n🔍 فحص المراجع المعطلة...');

  // weighbridge -> customers
  const brokenWb = db.exec(`
    SELECT w.id, w.date, w.customer_id
    FROM weighbridge w
    LEFT JOIN customers c ON w.customer_id = c.id
    WHERE c.id IS NULL
  `);

  if (brokenWb.length > 0) {
    console.log(`\n⚠️ وجدت ${brokenWb[0].values.length} سجل weighbridge بعميل غير موجود:`);
    brokenWb[0].values.slice(0, 10).forEach(row => {
      console.log(`   ID ${row[0]}: customer_id=${row[2]}, date=${row[1]}`);
      issues.push({
        table: 'weighbridge',
        id: row[0],
        issue: `مرجع عميل معطل: ${row[2]}`,
        suggestion: 'استبعاد هذا السجل أو إنشاء العميل'
      });
    });
  } else {
    console.log('✅ جميع مراجع weighbridge صحيحة');
  }

  // finance -> customers
  const brokenFin = db.exec(`
    SELECT f.id, f.date, f.customer_id
    FROM finance f
    LEFT JOIN customers c ON f.customer_id = c.id
    WHERE c.id IS NULL
  `);

  if (brokenFin.length > 0) {
    console.log(`\n⚠️ وجدت ${brokenFin[0].values.length} سجل finance بعميل غير موجود:`);
    brokenFin[0].values.forEach(row => {
      console.log(`   ID ${row[0]}: customer_id=${row[2]}, date=${row[1]}`);
      issues.push({
        table: 'finance',
        id: row[0],
        issue: `مرجع عميل معطل: ${row[2]}`,
        suggestion: 'استبعاد هذا السجل'
      });
    });
  } else {
    console.log('✅ جميع مراجع finance صحيحة');
  }

  // crates -> customers
  const brokenCr = db.exec(`
    SELECT cr.id, cr.date, cr.customer_id
    FROM crates cr
    LEFT JOIN customers c ON cr.customer_id = c.id
    WHERE c.id IS NULL
  `);

  if (brokenCr.length > 0) {
    console.log(`\n⚠️ وجدت ${brokenCr[0].values.length} سجل crates بعميل غير موجود:`);
    brokenCr[0].values.forEach(row => {
      console.log(`   ID ${row[0]}: customer_id=${row[2]}, date=${row[1]}`);
      issues.push({
        table: 'crates',
        id: row[0],
        issue: `مرجع عميل معطل: ${row[2]}`,
        suggestion: 'استبعاد هذا السجل'
      });
    });
  } else {
    console.log('✅ جميع مراجع crates صحيحة');
  }

  // 3. فحص المبالغ (التحقق من الحسابات)
  console.log('\n🔍 فحص صحة المبالغ...');

  // المعادلة الصحيحة: total = (net_weight / 45) * price_per_qantar
  const QANTAR_WEIGHT = 45;

  const wrongAmounts = db.exec(`
    SELECT
      id,
      date,
      net_weight,
      price_per_qantar,
      total,
      ((net_weight / ${QANTAR_WEIGHT}) * price_per_qantar) as calculated_total,
      ABS(total - ((net_weight / ${QANTAR_WEIGHT}) * price_per_qantar)) as difference
    FROM weighbridge
    WHERE ABS(total - ((net_weight / ${QANTAR_WEIGHT}) * price_per_qantar)) > 0.5
    ORDER BY difference DESC
    LIMIT 20
  `);

  if (wrongAmounts.length > 0) {
    console.log(`\n⚠️ وجدت ${wrongAmounts[0].values.length} سجل بمبالغ غير مطابقة للحساب:`);
    wrongAmounts[0].values.forEach(row => {
      const [id, date, netWeight, price, total, calcTotal, diff] = row;
      console.log(`   ID ${id} (${date}):`);
      console.log(`      المسجل: ${total.toFixed(2)} ج.م`);
      console.log(`      المحسوب: ${calcTotal.toFixed(2)} ج.م`);
      console.log(`      الفرق: ${diff.toFixed(2)} ج.م`);
      warnings.push({
        table: 'weighbridge',
        id: id,
        issue: `فرق في المبلغ: ${diff.toFixed(2)} ج.م`,
        suggestion: 'تحقق من صحة المبلغ أو طريقة الحساب'
      });
    });
  } else {
    console.log('✅ جميع المبالغ مطابقة للحسابات');
  }

  // 4. فحص الصناديق المسترجعة
  console.log('\n🔍 فحص الصناديق...');

  const cratesStats = db.exec(`
    SELECT
      SUM(crates_out) as total_out,
      SUM(crates_returned) as total_returned,
      COUNT(DISTINCT customer_id) as customers_with_crates
    FROM crates
  `);

  if (cratesStats.length > 0) {
    const [totalOut, totalReturned, customersCount] = cratesStats[0].values[0];
    console.log(`\n📊 إحصائيات الصناديق:`);
    console.log(`   مجموع الصادر: ${totalOut || 0}`);
    console.log(`   مجموع المسترجع: ${totalReturned || 0}`);
    console.log(`   المتبقي: ${(totalOut || 0) - (totalReturned || 0)}`);
    console.log(`   عدد العملاء الذين لديهم صناديق: ${customersCount || 0}`);

    if (totalReturned === 0 && totalOut > 0) {
      warnings.push({
        table: 'crates',
        issue: 'جميع الصناديق المسترجعة = 0',
        suggestion: 'تحقق من تسجيل استرجاع الصناديق أو أن البيانات صحيحة'
      });
    }
  }

  // 5. فحص التكرار
  console.log('\n🔍 فحص التكرار...');

  const duplicateCustomers = db.exec(`
    SELECT name, COUNT(*) as count
    FROM customers
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  if (duplicateCustomers.length > 0) {
    console.log(`\n⚠️ وجدت أسماء عملاء مكررة:`);
    duplicateCustomers[0].values.forEach(row => {
      console.log(`   ${row[0]}: ${row[1]} مرة`);
      warnings.push({
        table: 'customers',
        issue: `اسم مكرر: ${row[0]}`,
        suggestion: 'دمج أو إزالة التكرار'
      });
    });
  } else {
    console.log('✅ لا توجد أسماء عملاء مكررة');
  }

  // 6. ملخص الإحصائيات
  console.log('\n📊 ملخص البيانات:');

  const tableCounts = [
    'customers',
    'weighbridge',
    'finance',
    'crates',
    'crate_types',
    'date_types',
    'supervisors'
  ];

  tableCounts.forEach(table => {
    const result = db.exec(`SELECT COUNT(*) FROM ${table}`);
    const count = result[0].values[0][0];
    console.log(`   ${table}: ${count}`);
  });

  // 7. التقرير النهائي
  console.log('\n' + '='.repeat(60));
  console.log('📋 تقرير المراجعة');
  console.log('='.repeat(60));

  // معلومات السيزون
  console.log('\n📅 حالة السيزون:');
  if (hasActiveSeason) {
    console.log('   ✅ يوجد سيزون نشط - سيتم ربط البيانات به');
  } else {
    console.log('   ⚠️ لا يوجد سيزون نشط - البيانات لن تكون معزولة');
    console.log('   💡 للعزل الصحيح، أنشئ سيزون وفعلّه قبل الاستيراد');
  }

  console.log(`\n🚨 المشاكل الحرجة: ${issues.length}`);
  if (issues.length > 0) {
    console.log('\nيجب حل هذه المشاكل قبل الاستيراد:\n');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.table}] ID ${issue.id}:`);
      console.log(`   المشكلة: ${issue.issue}`);
      console.log(`   المقترح: ${issue.suggestion}\n`);
    });
  }

  console.log(`\n⚠️ التحذيرات: ${warnings.length}`);
  if (warnings.length > 0) {
    console.log('\nيجب مراجعة هذه النقاط:\n');
    warnings.forEach((warning, i) => {
      console.log(`${i + 1}. [${warning.table}] ${warning.issue}`);
      console.log(`   المقترح: ${warning.suggestion}\n`);
    });
  }

  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n✅ البيانات جاهزة للاستيراد!');
  } else {
    console.log('\n⚠️ يُنصح بحل المشاكل قبل الاستيراد.');
    console.log('   سكريبت الاستيراد سيستبعد السجلات المشكوك فيها تلقائياً.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('للاستمرار في الاستيراد، شغل: node import_data.js');
  console.log('='.repeat(60));
}

main().catch(console.error);
