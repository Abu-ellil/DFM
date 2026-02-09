import { LucideIcon } from 'lucide-react'
import {
  Settings as SettingsIcon,
  Plus,
  Bell,
  Database,
  Cloud,
  Calculator,
  Key,
  Shield,
  MessageCircle
} from 'lucide-react'

export interface SettingsSection {
  id: string
  label: string
  icon: LucideIcon
  description: string
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    label: 'الإعدادات العامة',
    icon: SettingsIcon,
    description: 'معلومات الشركة والأوزان الافتراضية'
  },
  {
    id: 'data',
    label: 'إدارة أنواع البيانات',
    icon: Plus,
    description: 'التمور والصناديق والمشرفين'
  },
  {
    id: 'telegram',
    label: 'تيليجرام',
    icon: Bell,
    description: 'إشعارات وإدارة البوت'
  },
  {
    id: 'database',
    label: 'قاعدة البيانات',
    icon: Database,
    description: 'النسخ الاحتياطي والاستيراد والتصدير'
  },
  {
    id: 'cloud',
    label: 'السحابة',
    icon: Cloud,
    description: 'الحساب السحابي والمزامنة'
  },
  {
    id: 'maintenance',
    label: 'الصيانة',
    icon: Calculator,
    description: 'التحقق من الحسابات وإصلاح الأخطاء'
  },
  {
    id: 'license',
    label: 'الترخيص',
    icon: Key,
    description: 'تفعيل البرنامج ومعلومات الترخيص'
  },
  {
    id: 'security',
    label: 'الأمان',
    icon: Shield,
    description: 'تغيير كلمة المرور وحذف البيانات'
  },
  {
    id: 'support',
    label: 'الدعم الفني',
    icon: MessageCircle,
    description: 'التواصل مع الدعم الفني'
  }
]
