import Link from 'next/link'
import { ArrowRight, BarChart3, Users, Database, Shield, Zap, Gift } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            مدير مصنع التمور
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            نظام إدارة شامل لعمليات مصنع التمور الخاص بك. تتبع العملاء،
            بيانات الميزان، الصناديق، المالية، والمزيد - كل ذلك في مكان واحد.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/trial-code"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 md:text-lg"
            >
              <Gift className="ml-2 w-5 h-5" />
              احصل على نسخة تجريبية
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="لوحة التحكم"
            description="نظرة عامة في الوقت الفعلي على عمليات مصنعك مع رسوم بيانية ومقاييس تفاعلية"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="إدارة العملاء"
            description="تتبع الموردين والعملاء مع ملفات تعريف تفصيلية وسجل المعاملات"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8" />}
            title="مزامنة البيانات"
            description="مزامنة سحابية تلقائية مع دعم العمل بدون اتصال لعمليات سلسة"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="آمن"
            description="أمان على مستوى المؤسسات مع مصادقة قائمة على الترخيص وعزل البيانات"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="سريع وموثوق"
            description="مبني على تقنيات حديثة لأداء فائق السرعة وموثوقية عالية"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="دعم المصانع المتعددة"
            description="إدارة مواقع مصانع متعددة مع قواعد بيانات معزولة وتحكم موحد"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <StatCard number="+1000" label="مستخدم نشط" />
            <StatCard number="+50" label="مصنع" />
            <StatCard number="+1M" label="معاملة" />
            <StatCard number="99.9%" label="وقت التشغيل" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">جاهز للبدء؟</h2>
        <p className="text-xl text-gray-600 mb-8">
          انضم إلى آلاف مديري المصانع الذين يثقون في مدير مصنع التمور
        </p>
        <Link
          href="/register"
          className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:text-lg"
        >
          إنشاء حساب
          <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
        </Link>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-white mb-2">{number}</div>
      <div className="text-primary-100">{label}</div>
    </div>
  )
}
