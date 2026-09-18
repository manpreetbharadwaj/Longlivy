import { PartialDictionary } from './types';

/**
 * Urdu (RTL) translations — partial by design, see `es.ts`'s header note
 * for the scoping rationale. Layout direction is handled globally via
 * `isRtlLanguage()` (`@/config/languages`), not per-string here.
 */
export const ur: PartialDictionary = {
  common: {
    back: 'واپس',
    cancel: 'منسوخ کریں',
    close: 'بند کریں',
    confirm: 'تصدیق کریں',
    continue: 'جاری رکھیں',
    done: 'ہو گیا',
    save: 'محفوظ کریں',
    saveChanges: 'تبدیلیاں محفوظ کریں',
    next: 'اگلا',
    skip: 'نظر انداز کریں',
    retry: 'دوبارہ کوشش کریں',
    delete: 'حذف کریں',
    edit: 'ترمیم کریں',
    add: 'شامل کریں',
    remove: 'ہٹائیں',
    ok: 'ٹھیک ہے',
    yes: 'ہاں',
    no: 'نہیں',
    loading: 'لوڈ ہو رہا ہے…',
  },
  errors: {
    generic: 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔',
    network: 'سرور تک رسائی نہیں ہو سکی۔ اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    bad_request: 'درخواست پر عمل نہیں ہو سکا۔',
    unauthorized: 'آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ ان کریں۔',
    forbidden: 'آپ کو ایسا کرنے کی اجازت نہیں ہے۔',
    not_found: 'ہمیں وہ نہیں ملا جو آپ ڈھونڈ رہے تھے۔',
    validation: 'دی گئی کچھ معلومات غلط ہیں۔',
    server: 'ہماری طرف سے کچھ غلط ہو گیا۔ تھوڑی دیر میں دوبارہ کوشش کریں۔',
    cancelled: 'درخواست منسوخ کر دی گئی۔',
    unknown: 'ایک غیر متوقع خرابی پیش آئی۔',
  },
  validation: {
    required: 'یہ خانہ درکار ہے۔',
    fieldRequired: '{{field}} درکار ہے۔',
    invalidEmail: 'ایک درست ای میل پتہ درج کریں۔',
    passwordTooShort: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔',
    passwordsDontMatch: 'پاس ورڈ مماثل نہیں ہیں۔',
  },
  language: {
    selectTitle: 'اپنی زبان منتخب کریں',
    selectSubtitle: 'آپ اسے بعد میں ترتیبات میں تبدیل کر سکتے ہیں۔',
    continueCta: 'جاری رکھیں',
  },
  splash: {
    tagline: 'روزہ · تغذیہ · سرگرمی · مراقبہ',
  },
  onboarding: {
    stepProgress: 'مرحلہ {{step}} از {{total}}',
    welcome: {
      tagline: 'آپ کی صحت، خوبصورت توازن میں۔',
      begin: 'شروع کریں',
    },
  },
};
