/**
 * سكريبت استيراد البيانات من قاعدة البيانات القديمة إلى الجديدة
 * مع معالجة المشاكل والتحقق من صحة البيانات
 *
 * الاستخدام: node import_data.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// المسارات
const OLD_DB_PATH = path.join(__dirname, 'date_factory_v2_2026-02-25_22-20-30.db.sqlite');
const NEW_DB_PATH = path.join(__dirname, 'date_factory_v2.db');
const BACKUP_PATH = path.join(__dirname, `date_factory_v2_backup_${Date.now()}.db`);

// إحصائيات الاستيراد
const stats = {
  customers: { imported: 0, skipped: 0, errors: [] },
  weighbridge: { imported: 0, skipped: 0, fixed: 0, errors: [] },
  finance: { imported: 0, skipped: 0, errors: [] },
  crates: { imported: 0, skipped: 0, errors: [] },
  crate_types: { imported: 0, skipped: 0 },
  date_types: { imported: 0, skipped: 0 },
  supervisors: { imported: 0, skipped: 0 }
};

// خيارات الاستيراد
const IMPORT_OPTIONS = {
  // السجل المشكوك بتاريخ 2015
  SKIP_OLD_DATES: true, // استبعاد السجلات قبل 2020
  MIN_VALID_DATE: '2020-01-01',

  // تصحيح التواريخ
  FIX_DATES: true,

  // التحقق من referential integrity
  VALIDATE_REFERENCES: true,

  // تجاوز الأخطاء
  CONTINUE_ON_ERROR: true
};

async function main() {
  console.log('=== بدء استيراد البيانات ===\n');

  // تحميل sql.js
  const SQL = await initSqlJs();

  // قراءة قاعدة البيانات القديمة
  console.log('📂 قراءة قاعدة البيانات القديمة:', OLD_DB_PATH);
  const oldBuffer = fs.readFileSync(OLD_DB_PATH);
  const oldDb = new SQL.Database(oldBuffer);

  // إنشاء نسخة احتياطية من قاعدة البيانات الحالية
  if (fs.existsSync(NEW_DB_PATH)) {
    console.log('💾 إنشاء نسخة احتياطية:', BACKUP_PATH);
    fs.copyFileSync(NEW_DB_PATH, BACKUP_PATH);
  }

  // قراءة قاعدة البيانات الجديدة (أو إنشاء جديدة)
  let newDb;
  if (fs.existsSync(NEW_DB_PATH)) {
    const newBuffer = fs.readFileSync(NEW_DB_PATH);
    newDb = new SQL.Database(newBuffer);
    console.log('📂 قراءة قاعدة البيانات الحالية');
  } else {
    newDb = new SQL.Database();
    console.log('📂 إنشاء قاعدة بيانات جديدة');
  }

  // التحقق من السيزون النشط وإنشاء سيزون جديد للبيانات المستوردة
  let activeSeasonId = null;
  const activeSeason = newDb.exec('SELECT id, name, start_date, end_date FROM seasons WHERE is_active = 1 LIMIT 1');

  if (activeSeason.length > 0 && activeSeason[0].values.length > 0) {
    activeSeasonId = activeSeason[0].values[0][0];
    const seasonName = activeSeason[0].values[0][1];
    const startDate = activeSeason[0].values[0][2];
    const endDate = activeSeason[0].values[0][3];
    console.log(`\n📅 السيزون النشط: ${seasonName} (${startDate} إلى ${endDate})`);
    console.log(`   سيتم ربط جميع البيانات المستوردة بهذا السيزون (ID: ${activeSeasonId})`);
  } else {
    console.log('\n⚠️ لا يوجد سيزون نشط!');
    console.log('   سيتم استيراد البيانات بدون ربط بسيزون.');
    console.log('   يُنصح بإنشاء سيزون وتفعيله قبل الاستيراد.');
  }

  console.log('\n--- بدء الاستيراد ---\n');

  // 1. استيراد crate_types
  await importCrateTypes(oldDb, newDb);

  // 2. استيراد date_types
  await importDateTypes(oldDb, newDb);

  // 3. استيراد supervisors
  await importSupervisors(oldDb, newDb);

  // 4. استيراد customers
  await importCustomers(oldDb, newDb);

  // 5. التحقق من العميل المفقود (customer_id = 492)
  await checkMissingCustomer(oldDb);

  // 6. استيراد weighbridge
  await importWeighbridge(oldDb, newDb, activeSeasonId);

  // 7. استيراد finance
  await importFinance(oldDb, newDb, activeSeasonId);

  // 8. استيراد crates
  await importCrates(oldDb, newDb, activeSeasonId);

  // حفظ قاعدة البيانات الجديدة
  console.log('\n💾 حفظ قاعدة البيانات...');
  const newData = newDb.export();
  const newBuffer = Buffer.from(newData);
  fs.writeFileSync(NEW_DB_PATH, newBuffer);

  // طباعة التقرير
  printReport();

  // اختيار عملاء عشوائيين للمراجعة
  await reviewRandomCustomers(oldDb, 5);

  console.log('\n✅ تم الاستيراد بنجاح!');
}

function importCrateTypes(oldDb, newDb) {
  console.log('\n📦 استيراد crate_types...');
  const result = oldDb.exec('SELECT * FROM crate_types');

  if (result.length === 0) {
    console.log('  لا توجد بيانات');
    return;
  }

  const stmt = newDb.prepare('INSERT OR REPLACE INTO crate_types (id, name, weight, is_default, created_at) VALUES (?, ?, ?, ?, ?)');

  result[0].values.forEach(row => {
    try {
      stmt.run([row[0], row[1], row[2], row[3], row[4]]);
      stats.crate_types.imported++;
    } catch (e) {
      stats.crate_types.skipped++;
    }
  });

  stmt.free();
  console.log(`  ✓ تم استيراد ${stats.crate_types.imported} نوع`);
}

function importDateTypes(oldDb, newDb) {
  console.log('\n📅 استيراد date_types...');
  const result = oldDb.exec('SELECT * FROM date_types');

  if (result.length === 0) {
    console.log('  لا توجد بيانات');
    return;
  }

  const stmt = newDb.prepare('INSERT OR REPLACE INTO date_types (id, name, created_at) VALUES (?, ?, ?)');

  result[0].values.forEach(row => {
    try {
      stmt.run([row[0], row[1], row[2]]);
      stats.date_types.imported++;
    } catch (e) {
      stats.date_types.skipped++;
    }
  });

  stmt.free();
  console.log(`  ✓ تم استيراد ${stats.date_types.imported} نوع`);
}

function importSupervisors(oldDb, newDb) {
  console.log('\n👷 استيراد supervisors...');
  const result = oldDb.exec('SELECT * FROM supervisors');

  if (result.length === 0) {
    console.log('  لا توجد بيانات');
    return;
  }

  const stmt = newDb.prepare('INSERT OR REPLACE INTO supervisors (id, name, created_at) VALUES (?, ?, ?)');

  result[0].values.forEach(row => {
    try {
      stmt.run([row[0], row[1], row[2]]);
      stats.supervisors.imported++;
    } catch (e) {
      stats.supervisors.skipped++;
    }
  });

  stmt.free();
  console.log(`  ✓ تم استيراد ${stats.supervisors.imported} مشرف`);
}

function importCustomers(oldDb, newDb) {
  console.log('\n👥 استيراد customers...');
  const result = oldDb.exec('SELECT * FROM customers');

  if (result.length === 0) {
    console.log('  لا توجد بيانات');
    return;
  }

  const stmt = newDb.prepare(`
    INSERT OR REPLACE INTO customers
    (id, name, type, phone, created_at, _client_id, _synced_at, _version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  result[0].values.forEach(row => {
    try {
      stmt.run([row[0], row[1], row[2], row[3] || null, row[4], row[5] || null, row[6] || null, row[7] || 1]);
      stats.customers.imported++;
    } catch (e) {
      stats.customers.skipped++;
      stats.customers.errors.push({ name: row[1], error: e.message });
    }
  });

  stmt.free();
  console.log(`  ✓ تم استيراد ${stats.customers.imported} عميل (تم تخطي ${stats.customers.skipped})`);
}

function importWeighbridge(oldDb, newDb, activeSeasonId) {
  console.log('\n⚖️ استيراد weighbridge...');

  // الحصول على قائمة العملاء الموجودين في قاعدة البيانات الجديدة
  const validCustomers = new Set();
  const customersResult = newDb.exec('SELECT id FROM customers');
  if (customersResult.length > 0) {
    customersResult[0].values.forEach(row => validCustomers.add(row[0]));
  }

  // الحصول على قائمة أنواع التمور الموجودة
  const validDateTypes = new Set();
  const dateTypesResult = newDb.exec('SELECT id FROM date_types');
  if (dateTypesResult.length > 0) {
    dateTypesResult[0].values.forEach(row => validDateTypes.add(row[0]));
  }

  const result = oldDb.exec('SELECT * FROM weighbridge');

  if (result.length === 0) {
    console.log('  لا توجد بيانات');
    return;
  }

  const stmt = newDb.prepare(`
    INSERT INTO weighbridge
    (id, date, customer_id, date_type_id, gross_weight, net_weight, price_per_qantar,
     total, crates_count, commission, notes, season_id, created_at, _client_id, _synced_at, _version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const QANTAR_WEIGHT = 45; // وزن القنطار بالكيلوجرام

  result[0].values.forEach((row, idx) => {
    const [id, date, customerId, dateTypeId, grossWeight, netWeight, pricePerQantar,
          total, cratesCount, createdAt, notes, commission, clientId, syncedAt, version] = row;

    try {
      // التحقق من التاريخ
      if (IMPORT_OPTIONS.SKIP_OLD_DATES && date < IMPORT_OPTIONS.MIN_VALID_DATE) {
        stats.weighbridge.skipped++;
        stats.weighbridge.errors.push({
          id,
          reason: `تاريخ قديم جداً: ${date}`,
          data: { date, customerId }
        });
        return;
      }

      // التحقق من وجود العميل
      if (IMPORT_OPTIONS.VALIDATE_REFERENCES && !validCustomers.has(customerId)) {
        stats.weighbridge.skipped++;
        stats.weighbridge.errors.push({
          id,
          reason: `عميل غير موجود: ${customerId}`,
          data: { date, customerId }
        });
        return;
      }

      // التحقق من date_type_id
      const validDateTypeId = (dateTypeId && validDateTypes.has(dateTypeId)) ? dateTypeId : null;

      // التحقق من صحة المبلغ باستخدام المعادلة الصحيحة
      // المعادلة: total = (net_weight / QANTAR_WEIGHT) * price_per_qantar
      const calculatedTotal = (netWeight / QANTAR_WEIGHT) * pricePerQantar;
      const tolerance = 0.5; // تسامح 50 قرش للفروقات الدقيقة

      if (Math.abs(total - calculatedTotal) > tolerance) {
        console.log(`  ⚠️ تحذير: السجل ${id} (${date}) - المبلغ لا يطابق الحساب:`);
        console.log(`     المبلغ المسجل: ${total.toFixed(2)} ج.م`);
        console.log(`     المبلغ المحسوب: ${calculatedTotal.toFixed(2)} ج.م`);
        console.log(`     الفرق: ${Math.abs(total - calculatedTotal).toFixed(2)} ج.م`);
      }

      stmt.run([
        id, date, customerId, validDateTypeId, grossWeight, netWeight, pricePerQantar,
        total, cratesCount, commission, notes, activeSeasonId, createdAt, clientId, syncedAt, version || 1
      ]);

      stats.weighbridge.imported++;

    } catch (e) {
      stats.weighbridge.skipped++;
      stats.weighbridge.errors.push({
        id,
        reason: e.message,
        data: { date, customerId }
      });

      if (!IMPORT_OPTIONS.CONTINUE_ON_ERROR) {
        throw e;
      }
    }
  });

  stmt.free();
  console.log(`  ✓ تم استيراد ${stats.weighbridge.imported} سجل (تم تخطي ${stats.weighbridge.skipped})`);

  if (stats.weighbridge.errors.length > 0) {
    console.log(`  ⚠️ تم تخطي ${stats.weighbridge.errors.length} سجل بسبب أخطاء`);
    console.log(`  ملاحظة: تم استخدام المعادلة الصحيحة: total = (net_weight / 45) × price_per_qantar`);
  }
}

function checkMissingCustomer(oldDb) {
  console.log('\n🔍 فحص العميل المفقود (customer_id = 492)...');

  // البحث عن جميع السجلات المرتبطة بالعميل 492
  const weighbridge = oldDb.exec('SELECT COUNT(*) FROM weighbridge WHERE customer_id = 492');
  const crates = oldDb.exec('SELECT COUNT(*) FROM crates WHERE customer_id = 492');

  console.log(`   سجلات weighbridge: ${weighbridge[0]?.values[0]?.[0] || 0}`);
  console.log(`   سجلات crates: ${crates[0]?.values[0]?.[0] || 0}`);

  // البحث عن اسم العميل في سجلات أخرى
  const otherRefs = oldDb.exec(`
    SELECT DISTINCT w.customer_id, c.name
    FROM weighbridge w
    LEFT JOIN customers c ON w.customer_id = c.id
    WHERE w.customer_id BETWEEN 490 AND 495
  `);

  if (otherRefs.length > 0) {
    console.log('   العملاء في هذا النطاق:');
    otherRefs[0].values.forEach(row => {
      console.log(`     ID ${row[0]}: ${row[1] || '(غير موجود)'}`);
    });
  }

  console.log('   ملاحظة: سيتم استبعاد السجلات المرتبطة بالعميل 492');
}

function importFinance(oldDb, newDb, activeSeasonId) {
  console.log('\n💰 استيراد finance...');

  const validCustomers = new Set();
  const customersResult = newDb.exec('SELECT id FROM customers');
  if (customersResult.length > 0) {
    customersResult[0].values.forEach(row => validCustomers.add(row[0]));
  }

  const result = oldDb.exec('SELECT * FROM finance');

  if (result.length === 0) {
    console.log('  لا توجد بيانات');
    return;
  }

  const stmt = newDb.prepare(`
    INSERT INTO finance
    (id, date, customer_id, transaction_type, amount_paid, amount_received,
     notes, season_id, created_at, _client_id, _synced_at, _version, payment_method, receipt_file, receipt_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  result[0].values.forEach((row, idx) => {
    const [id, date, customerId, transactionType, amountPaid, amountReceived,
          notes, createdAt, clientId, syncedAt, version, paymentMethod, receiptFile, receiptReference] = row;

    try {
      if (IMPORT_OPTIONS.VALIDATE_REFERENCES && !validCustomers.has(customerId)) {
        stats.finance.skipped++;
        stats.finance.errors.push({
          id,
          reason: `عميل غير موجود: ${customerId}`
        });
        return;
      }

      stmt.run([
        id, date, customerId, transactionType, amountPaid, amountReceived,
        notes, activeSeasonId, createdAt, clientId, syncedAt, version || 1,
        paymentMethod || 'نقدا', receiptFile || null, receiptReference || null
      ]);

      stats.finance.imported++;

    } catch (e) {
      stats.finance.skipped++;
      stats.finance.errors.push({ id, reason: e.message });
    }
  });

  stmt.free();
  console.log(`  ✓ تم استيراد ${stats.finance.imported} سجل (تم تخطي ${stats.finance.skipped})`);
}

function importCrates(oldDb, newDb, activeSeasonId) {
  console.log('\n📦 استيراد crates...');

  const validCustomers = new Set();
  const customersResult = newDb.exec('SELECT id FROM customers');
  if (customersResult.length > 0) {
    customersResult[0].values.forEach(row => validCustomers.add(row[0]));
  }

  const validCrateTypes = new Set();
  const crateTypesResult = newDb.exec('SELECT id FROM crate_types');
  if (crateTypesResult.length > 0) {
    crateTypesResult[0].values.forEach(row => validCrateTypes.add(row[0]));
  }

  const result = oldDb.exec('SELECT * FROM crates');

  if (result.length === 0) {
    console.log('  لا توجد بيانات');
    return;
  }

  const stmt = newDb.prepare(`
    INSERT INTO crates
    (id, date, customer_id, crate_type_id, crates_out, crates_returned, handler, notes, season_id,
     created_at, _client_id, _synced_at, _version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  result[0].values.forEach((row, idx) => {
    const [id, date, customerId, cratesOut, cratesReturned, handler, notes,
          createdAt, crateTypeId, clientId, syncedAt, version] = row;

    try {
      if (IMPORT_OPTIONS.VALIDATE_REFERENCES && !validCustomers.has(customerId)) {
        stats.crates.skipped++;
        stats.crates.errors.push({
          id,
          reason: `عميل غير موجود: ${customerId}`
        });
        return;
      }

      const validCrateTypeId = (crateTypeId && validCrateTypes.has(crateTypeId)) ? crateTypeId : null;

      stmt.run([
        id, date, customerId, validCrateTypeId, cratesOut, cratesReturned,
        handler, notes, activeSeasonId, createdAt, clientId, syncedAt, version || 1
      ]);

      stats.crates.imported++;

    } catch (e) {
      stats.crates.skipped++;
      stats.crates.errors.push({ id, reason: e.message });
    }
  });

  stmt.free();
  console.log(`  ✓ تم استيراد ${stats.crates.imported} سجل (تم تخطي ${stats.crates.skipped})`);
}

function printReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 تقرير الاستيراد');
  console.log('='.repeat(60));

  const tables = [
    { name: 'Customers', data: stats.customers },
    { name: 'Weighbridge', data: stats.weighbridge },
    { name: 'Finance', data: stats.finance },
    { name: 'Crates', data: stats.crates },
    { name: 'Crate Types', data: stats.crate_types },
    { name: 'Date Types', data: stats.date_types },
    { name: 'Supervisors', data: stats.supervisors }
  ];

  tables.forEach(table => {
    console.log(`\n${table.name}:`);
    console.log(`  ✓ تم استيراد: ${table.data.imported}`);
    console.log(`  ⏭️ تم تخطي: ${table.data.skipped}`);
    if (table.data.errors && table.data.errors.length > 0) {
      console.log(`  ⚠️ أخطاء: ${table.data.errors.length}`);
      table.data.errors.slice(0, 5).forEach(err => {
        console.log(`     - ID ${err.id}: ${err.reason}`);
      });
      if (table.data.errors.length > 5) {
        console.log(`     ... و ${table.data.errors.length - 5} آخرين`);
      }
    }
  });

  console.log('\n' + '='.repeat(60));
}

async function reviewRandomCustomers(db, count) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 مراجعة حسابات عملاء عشوائيين');
  console.log('='.repeat(60));

  // الحصول على العملاء الذين لديهم معاملات
  const customers = db.exec(`
    SELECT DISTINCT c.id, c.name, c.type
    FROM customers c
    INNER JOIN weighbridge w ON c.id = w.customer_id
    ORDER BY RANDOM()
    LIMIT ${count}
  `);

  if (customers.length === 0) {
    console.log('لا توجد بيانات للمراجعة');
    return;
  }

  for (const customer of customers[0].values) {
    const [customerId, customerName, customerType] = customer;

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`👤 العميل: ${customerName} (ID: ${customerId}) - ${customerType}`);
    console.log('─'.repeat(60));

    // سجلات الوزن
    const weighbridge = db.exec(`
      SELECT
        COUNT(*) as trips,
        SUM(net_weight) as total_weight,
        SUM(total) as total_amount,
        SUM(commission) as total_commission,
        MIN(date) as first_date,
        MAX(date) as last_date
      FROM weighbridge
      WHERE customer_id = ${customerId}
    `);

    if (weighbridge.length > 0) {
      const [trips, totalWeight, totalAmount, totalCommission, firstDate, lastDate] = weighbridge[0].values[0];
      console.log(`\n⚖️ سجلات الوزن:`);
      console.log(`   عدد الرحلات: ${trips}`);
      console.log(`   مجموع الوزن: ${totalWeight?.toFixed(0) || 0} kg`);
      console.log(`   مجموع المبالغ: ${totalAmount?.toFixed(2) || 0} ج.م`);
      console.log(`   مجموع العمولات: ${totalCommission?.toFixed(2) || 0} ج.م`);
      console.log(`   من ${firstDate} إلى ${lastDate}`);

      // آخر 3 رحلات
      const lastTrips = db.exec(`
        SELECT date, net_weight, total, price_per_qantar
        FROM weighbridge
        WHERE customer_id = ${customerId}
        ORDER BY date DESC, id DESC
        LIMIT 3
      `);

      if (lastTrips.length > 0) {
        console.log(`\n   آخر 3 رحلات:`);
        lastTrips[0].values.forEach((trip, i) => {
          console.log(`   ${i + 1}. ${trip[0]} - ${trip[1].toFixed(0)}kg - ${trip[2].toFixed(2)}ج.م (سعر: ${trip[3]}/قنطار)`);
        });
      }
    }

    // سجلات المالية
    const finance = db.exec(`
      SELECT
        COUNT(*) as transactions,
        SUM(amount_paid) as total_paid,
        SUM(amount_received) as total_received
      FROM finance
      WHERE customer_id = ${customerId}
    `);

    if (finance.length > 0) {
      const [transactions, totalPaid, totalReceived] = finance[0].values[0];
      console.log(`\n💰 سجلات المالية:`);
      console.log(`   عدد المعاملات: ${transactions || 0}`);
      console.log(`   مجموع المدفوعات: ${totalPaid?.toFixed(2) || 0} ج.م`);
      console.log(`   مجموع المستحقات: ${totalReceived?.toFixed(2) || 0} ج.م`);

      if (transactions > 0) {
        const lastPayments = db.exec(`
          SELECT date, transaction_type, amount_paid, payment_method, notes
          FROM finance
          WHERE customer_id = ${customerId}
          ORDER BY date DESC
          LIMIT 3
        `);

        if (lastPayments.length > 0) {
          console.log(`\n   آخر 3 مدفوعات:`);
          lastPayments[0].values.forEach((pay, i) => {
            console.log(`   ${i + 1}. ${pay[0]} - ${pay[2]?.toFixed(0) || 0}ج.م (${pay[1]}) - ${pay[3] || 'نقدا'}`);
            if (pay[4]) console.log(`      ملاحظة: ${pay[4]}`);
          });
        }
      }
    }

    // سجلات الصناديق
    const crates = db.exec(`
      SELECT
        COUNT(*) as records,
        SUM(crates_out) as total_out,
        SUM(crates_returned) as total_returned
      FROM crates
      WHERE customer_id = ${customerId}
    `);

    if (crates.length > 0) {
      const [records, totalOut, totalReturned] = crates[0].values[0];
      console.log(`\n📦 سجلات الصناديق:`);
      console.log(`   عدد السجلات: ${records || 0}`);
      console.log(`   مجموع الصادر: ${totalOut || 0}`);
      console.log(`   مجموع المسترجع: ${totalReturned || 0}`);
      console.log(`   المتبقي: ${(totalOut || 0) - (totalReturned || 0)} صندوق`);
    }

    // حساب الرصيد
    if (weighbridge.length > 0 && finance.length > 0) {
      const totalAmount = weighbridge[0].values[0][2] || 0;
      const totalPaid = finance[0].values[0][1] || 0;
      const balance = totalAmount - totalPaid;

      console.log(`\n📊 ملخص الحساب:`);
      console.log(`   المستحق عليه: ${totalAmount.toFixed(2)} ج.م`);
      console.log(`   ما تم دفعه: ${totalPaid.toFixed(2)} ج.م`);
      console.log(`   الرصيد المتبقي: ${balance.toFixed(2)} ج.م`);

      if (balance > 0) {
        console.log(`   ⚠️ عليه مبلغ: ${balance.toFixed(2)} ج.م`);
      } else if (balance < 0) {
        console.log(`   ✅ له دفعة مقدمة: ${Math.abs(balance).toFixed(2)} ج.م`);
      } else {
        console.log(`   ✅ الحساب متوازن`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
}

// تشغيل السكريبت
main().catch(console.error);
