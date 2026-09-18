import { PartialDictionary } from './types';

/** Turkish translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const tr: PartialDictionary = {
  common: {
    back: 'Geri',
    cancel: 'İptal',
    close: 'Kapat',
    confirm: 'Onayla',
    continue: 'Devam et',
    done: 'Bitti',
    save: 'Kaydet',
    saveChanges: 'Değişiklikleri kaydet',
    next: 'İleri',
    skip: 'Atla',
    retry: 'Tekrar dene',
    delete: 'Sil',
    edit: 'Düzenle',
    add: 'Ekle',
    remove: 'Kaldır',
    ok: 'Tamam',
    yes: 'Evet',
    no: 'Hayır',
    loading: 'Yükleniyor…',
  },
  errors: {
    generic: 'Bir şeyler yanlış gitti. Lütfen tekrar deneyin.',
    network: 'Sunucuya ulaşılamıyor. Bağlantınızı kontrol edip tekrar deneyin.',
    bad_request: 'İstek işlenemedi.',
    unauthorized: 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.',
    forbidden: 'Bunu yapmaya yetkiniz yok.',
    not_found: 'Aradığınızı bulamadık.',
    validation: 'Girilen bilgilerin bir kısmı geçersiz.',
    server: 'Bizim tarafımızda bir şeyler yanlış gitti. Lütfen kısa süre sonra tekrar deneyin.',
    cancelled: 'İstek iptal edildi.',
    unknown: 'Beklenmeyen bir hata oluştu.',
  },
  validation: {
    required: 'Bu alan zorunludur.',
    fieldRequired: '{{field}} zorunludur.',
    invalidEmail: 'Geçerli bir e-posta adresi girin.',
    passwordTooShort: 'Şifre en az 8 karakter olmalıdır.',
    passwordsDontMatch: 'Şifreler eşleşmiyor.',
  },
  language: {
    selectTitle: 'Dilinizi seçin',
    selectSubtitle: "Bunu daha sonra Ayarlar'dan değiştirebilirsiniz.",
    continueCta: 'Devam et',
  },
  splash: {
    tagline: 'Oruç · Beslenme · Aktivite · Meditasyon',
  },
  onboarding: {
    stepProgress: '{{total}} adımın {{step}}.',
    welcome: {
      tagline: 'Sağlığın, uyum içinde.',
      begin: 'Başla',
    },
  },
};
