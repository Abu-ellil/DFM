# نظام إدارة الموقع (Admin System Documentation)

## نظرة عامة (Overview)

هذا النظام يوفر لوحة تحكم كاملة للمسؤولين لإدارة المستخدمين ومفاتيح الترخيص.

This system provides a complete admin control panel for managing users and license keys.

---

## المميزات (Features)

### إدارة المستخدمين (User Management)

- ✅ عرض جميع المستخدمين
- ✅ إنشاء مستخدم جديد
- ✅ تحديث بيانات المستخدم
- ✅ تفعيل حساب المستخدم (Activate)
- ✅ إلغاء تفعيل حساب المستخدم (Deactivate)
- ✅ حظر المستخدم (Ban)
- ✅ حذف المستخدم (Delete)

### إدارة مفاتيح الترخيص (License Management)

- ✅ عرض جميع مفاتيح الترخيص
- ✅ إنشاء مفتاح ترخيص جديد
- ✅ تفعيل مفتاح الترخيص (Activate)
- ✅ إلغاء تفعيل مفتاح الترخيص (Deactivate)
- ✅ حظر مفتاح الترخيص (Ban)
- ✅ حذف مفتاح الترخيص (Delete)

---

## التثبيت والإعداد (Installation & Setup)

### 1. إنشاء حساب المسؤول (Create Admin Account)

قم بتشغيل السكريبت لإنشاء حساب المسؤول:

```bash
cd vercel-api
export NEON_DATABASE_URL="your-database-url"
node scripts/create-admin.js
```

سيطلب منك السكريبت إدخال:

- رقم الهاتف
- كلمة المرور (6 أحرف على الأقل)
- الاسم الكامل (اختياري)
- اسم المصنع (اختياري)

### 2. تسجيل الدخول (Login)

بعد إنشاء حساب المسؤول، يمكنك تسجيل الدخول من:

```
https://dfm-mu.vercel.app/login
```

### 3. لوحة التحكم (Admin Dashboard)

بعد تسجيل الدخول بحساب مسؤول، ستتم إعادة توجيهك إلى:

```
https://dfm-mu.vercel.app/admin
```

---

## واجهة برمجة التطبيقات (API Endpoints)

### إحصائيات النظام (System Stats)

```
GET /api/admin/stats
```

### إدارة المستخدمين (User Management)

#### عرض جميع المستخدمين

```
GET /api/admin/users
```

#### إنشاء مستخدم جديد

```
POST /api/admin/users
Body: {
  phone: string,
  password: string,
  full_name?: string,
  factory_name?: string,
  role?: string
}
```

#### تحديث مستخدم

```
PUT /api/admin/users/:id
Body: {
  full_name?: string,
  factory_name?: string,
  role?: string
}
```

#### حذف مستخدم

```
DELETE /api/admin/users/:id
```

#### تفعيل مستخدم

```
POST /api/admin/users/:id/activate
```

#### إلغاء تفعيل مستخدم

```
POST /api/admin/users/:id/deactivate
```

#### حظر مستخدم

```
POST /api/admin/users/:id/ban
```

### إدارة مفاتيح الترخيص (License Management)

#### عرض جميع مفاتيح الترخيص

```
GET /api/admin/licenses
```

#### إنشاء مفتاح ترخيص جديد

```
POST /api/admin/licenses
Body: {
  license_key: string,
  machine_id: string,
  factory_name?: string,
  duration_code?: string,
  expiry_date?: string
}
```

#### حذف مفتاح ترخيص

```
DELETE /api/admin/licenses/:id
```

#### تفعيل مفتاح ترخيص

```
POST /api/admin/licenses/:id/activate
```

#### إلغاء تفعيل مفتاح ترخيص

```
POST /api/admin/licenses/:id/deactivate
```

#### حظر مفتاح ترخيص

```
POST /api/admin/licenses/:id/ban
```

---

## حالات المستخدم والمفتاح (Status Types)

### حالات المستخدم (User Status)

- `active` - نشط (Active)
- `inactive` - غير نشط (Inactive)
- `banned` - محظور (Banned)

### حالات مفتاح الترخيص (License Status)

- `active` - نشط (Active)
- `inactive` - غير نشط (Inactive)
- `banned` - محظور (Banned)
- `expired` - منتهي (Expired)

---

## الأدوار (Roles)

- `admin` - مسؤول (Administrator)
- `manager` - مدير (Manager)
- `user` - مستخدم (User)
- `worker` - عامل (Worker)

---

## الأمان (Security)

- جميع نقاط النهاية محمية بمصادقة JWT
- كلمات المرور مشفرة باستخدام bcrypt
- فقط المستخدمين بدور `admin` يمكنهم الوصول للوحة التحكم

---

## استخدام واجهة برمجة التطبيقات (Using the API)

### مثال على طلب (Request Example)

```javascript
// Get all users
const response = await fetch('https://dfm-mu.vercel.app/api/admin/users', {
  headers: {
    Authorization: 'Bearer YOUR_JWT_TOKEN'
  }
})

const data = await response.json()
console.log(data.users)
```

### مثال على إنشاء مستخدم (Create User Example)

```javascript
const response = await fetch('https://dfm-mu.vercel.app/api/admin/users', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '+201234567890',
    password: 'password123',
    full_name: 'John Doe',
    factory_name: 'Factory A',
    role: 'user'
  })
})
```

---

## استكشاف الأخطاء (Troubleshooting)

### خطأ: Unauthorized (غير مصرح)

- تأكد من تسجيل الدخول بحساب مسؤول
- تأكد من أن التوكن صالح ولم تنتهي صلاحيته

### خطأ: Forbidden (ممنوع)

- تأكد من أن حسابك له دور `admin`

### خطأ: Missing NEON_DATABASE_URL

- تأكد من تعيين متغير البيئة `NEON_DATABASE_URL`

---

## الدعم (Support)

للحصول على الدعم، يرجى التواصل مع:

- البريد الإلكتروني: support@datesfactory.com

---

## التحديثات (Updates)

### الإصدار 1.0.0

- ✅ إضافة لوحة تحكم المسؤول
- ✅ إدارة المستخدمين (إنشاء، تحديث، حذف)
- ✅ إدارة مفاتيح الترخيص (إنشاء، تفعيل، حظر)
- ✅ نظام المصادقة JWT
- ✅ سكريبت إنشاء حساب المسؤول

---

## ملاحظات (Notes)

- جميع العمليات تتطلب توكن JWT صالح
- كلمات المرور يجب أن تكون 6 أحرف على الأقل
- المستخدم المحظور لا يمكنه تسجيل الدخول
- المفتاح المحظور لا يمكن استخدامه للترخيص
