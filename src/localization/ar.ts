import { PartialDictionary } from './types';

/**
 * Arabic (RTL) translations — partial by design, see `es.ts`'s header note
 * for the scoping rationale. Layout direction is handled globally via
 * `isRtlLanguage()` (`@/config/languages`), not per-string here.
 */
export const ar: PartialDictionary = {
  common: {
    back: 'رجوع',
    cancel: 'إلغاء',
    close: 'إغلاق',
    confirm: 'تأكيد',
    continue: 'متابعة',
    done: 'تم',
    save: 'حفظ',
    saveChanges: 'حفظ التغييرات',
    next: 'التالي',
    skip: 'تخطي',
    retry: 'إعادة المحاولة',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    remove: 'إزالة',
    ok: 'حسنًا',
    yes: 'نعم',
    no: 'لا',
    loading: 'جارٍ التحميل…',
  },
  errors: {
    generic: 'حدث خطأ ما. حاول مرة أخرى.',
    network: 'تعذّر الوصول إلى الخادم. تحقق من اتصالك وحاول مرة أخرى.',
    bad_request: 'تعذّرت معالجة الطلب.',
    unauthorized: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
    forbidden: 'ليس لديك إذن للقيام بذلك.',
    not_found: 'لم نتمكن من العثور على ما كنت تبحث عنه.',
    validation: 'بعض المعلومات المُدخلة غير صالحة.',
    server: 'حدث خطأ من جانبنا. حاول مرة أخرى بعد قليل.',
    cancelled: 'تم إلغاء الطلب.',
    unknown: 'حدث خطأ غير متوقع.',
  },
  validation: {
    required: 'هذا الحقل مطلوب.',
    fieldRequired: '{{field}} مطلوب.',
    invalidEmail: 'أدخل عنوان بريد إلكتروني صالحًا.',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.',
    passwordsDontMatch: 'كلمتا المرور غير متطابقتين.',
  },
  language: {
    selectTitle: 'اختر لغتك',
    selectSubtitle: 'يمكنك تغيير ذلك لاحقًا في الإعدادات.',
    continueCta: 'متابعة',
  },
  splash: {
    tagline: 'الصيام · التغذية · النشاط · التأمل',
  },
  onboarding: {
    stepProgress: 'الخطوة {{step}} من {{total}}',
    welcome: {
      tagline: 'صحتك، في توازن جميل.',
      begin: 'ابدأ',
    },
  },
};
