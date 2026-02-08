# الحل لمشكلة الحساب السحابي والتخزين السحابي

## المشكلة

نقاط نهاية API للمصادقة (`/api/auth/register`, `/api/auth/login`, `/api/sync/restore`) لم تكن موجودة على السحابة، مما تسبب في فشل إنشاء الحساب السحابي وتسجيل الدخول واستعادة البيانات.

## الحل المنفذ

### 1. إنشاء نقاط نهاية API الجديدة

تم إنشاء الملفات التالية في `vercel-api/api/`:

#### `api/auth/register.ts`

- **الوظيفة**: إنشاء حساب سحابي جديد
- **المدخلات**: phone, password, machine_id, full_name (اختياري), factory_name (اختياري)
- **المخرجات**: success, message, user data
- **الميزات**:
  - التحقق من صحة البيانات
  - تشفير كلمة المرور باستخدام bcrypt
  - إنشاء جدول auth_users تلقائياً إذا لم يكن موجوداً
  - منع التسجيل المكرر لنفس رقم الهاتف

#### `api/auth/login.ts`

- **الوظيفة**: تسجيل الدخول إلى الحساب السحابي
- **المدخلات**: phone, password
- **المخرجات**: success, message, user data
- **الميزات**:
  - التحقق من بيانات الاعتماد باستخدام bcrypt
  - إرجاع معلومات المستخدم (phone, full_name, factory_name, machine_id)

#### `api/sync/restore.ts`

- **الوظيفة**: استعادة البيانات من السحابة
- **المدخلات**: phone, password
- **المخرجات**: success, data (جميع التغييرات), message
- **الميزات**:
  - التحقق من صحة كلمة المرور
  - تحميل جميع البيانات من الجداول: customers, weighbridge, crates, finance, users
  - تصفية البيانات حسب machine_id

### 2. تحديثات أخرى

#### `vercel-api/package.json`

- إضافة مكتبة `bcryptjs` لتشفير كلمات المرور

#### `src/main/web-auth.ts`

- تصحيح إرسال كلمة المرور (الآن ترسل ككلمة مرور نصية، الـ API يقوم بتشفيرها)

## خطوات النشر على Vercel

### الطريقة 1: استخدام Vercel CLI (موصى به)

```bash
cd vercel-api
npx vercel login
npx vercel --prod
```

### الطريقة 2: من خلال موقع Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل الدخول أو أنشئ حساباً
3. اضغط على "Add New Project"
4. ربط مستودع GitHub الخاص بك (أو رفع الملفات يدوياً)
5. اضبط الإعدادات التالية:
   - **Framework Preset**: Other
   - **Root Directory**: `vercel-api`
   - **Build Command**: `echo 'No build needed'`
   - **Output Directory**: `./`

6. أضف متغيرات البيئة (Environment Variables):

   ```
   NEON_DATABASE_URL=your_neon_connection_string
   NEON_PROJECT_ID=your_project_id
   NEON_DB_PASSWORD=your_db_password
   ```

7. اضغط على "Deploy"

## متغيرات البيئة المطلوبة

لنشر الـ API بنجاح، يجب إعداد متغيرات البيئة التالية في Vercel:

```bash
# رابط اتصال قاعدة بيانات Neon
NEON_DATABASE_URL=postgres://user:password@ep-name.region.aws.neon.tech/neondb?sslmode=require

# معرف مشروع Neon (اختياري)
NEON_PROJECT_ID=your_project_id

# كلمة مرور قاعدة البيانات (اختياري)
NEON_DB_PASSWORD=your_db_password
```

### الحصول على رابط قاعدة بيانات Neon

1. سجل في [neon.tech](https://neon.tech)
2. أنشئ مشروعاً جديداً
3. انتقل إلى Dashboard -> Project Settings
4. انسخ رابط الاتصال (Connection String)

## الاختبار بعد النشر

بعد نشر الـ API بنجاح، يمكنك اختباره باستخدام curl أو Postman:

### اختبار التسجيل:

```bash
curl -X POST https://dates-factory-manager-cloud.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"0555555555","password":"password123","machine_id":"ABC1234567890123","factory_name":"مصنع التمور"}'
```

### اختبار تسجيل الدخول:

```bash
curl -X POST https://dates-factory-manager-cloud.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0555555555","password":"password123"}'
```

### اختبار استعادة البيانات:

```bash
curl -X POST https://dates-factory-manager-cloud.vercel.app/api/sync/restore \
  -H "Content-Type: application/json" \
  -d '{"phone":"0555555555","password":"password123"}'
```

## هيكل قاعدة البيانات

الـ API سيقوم تلقائياً بإنشاء الجدول التالي:

```sql
CREATE TABLE IF NOT EXISTS auth_users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  machine_id VARCHAR(50) NOT NULL,
  full_name VARCHAR(100),
  factory_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## التحقق من العمل

1. افتح التطبيق
2. انتقل إلى "إعدادات" -> "الحساب السحابي"
3. اضغط على "حساب جديد"
4. أدخل رقم الهاتف وكلمة المرور
5. اضغط "إنشاء الحساب"
6. إذا نجح التسجيل، ستظهر رسالة نجاح وسيظهر الحالة كـ "متصل"

## استكشاف الأخطاء

### خطأ 404:

- تأكد من نشر الـ API على Vercel
- تحقق من صحة الرابط في `WEB_AUTH_API_URL` في `src/main/web-auth.ts`

### خطأ 500:

- تحقق من سجلات Vercel (Logs)
- تأكد من إعداد `NEON_DATABASE_URL` بشكل صحيح

### خطأ في الاتصال بقاعدة البيانات:

- تأكد من أن رابط Neon يعمل
- تحقق من أن SSL مفعّل في رابط الاتصال

## الدعم

إذا واجهت أي مشاكل:

- تحقق من سجلات Vercel: `vercel logs --prod`
- راجع وثائق Neon: https://neon.tech/docs
- راجع وثائق Vercel: https://vercel.com/docs
