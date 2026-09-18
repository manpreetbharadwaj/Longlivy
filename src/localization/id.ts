import { PartialDictionary } from './types';

/** Indonesian translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const id: PartialDictionary = {
  common: {
    back: 'Kembali',
    cancel: 'Batal',
    close: 'Tutup',
    confirm: 'Konfirmasi',
    continue: 'Lanjutkan',
    done: 'Selesai',
    save: 'Simpan',
    saveChanges: 'Simpan perubahan',
    next: 'Berikutnya',
    skip: 'Lewati',
    retry: 'Coba lagi',
    delete: 'Hapus',
    edit: 'Edit',
    add: 'Tambah',
    remove: 'Hapus',
    ok: 'OK',
    yes: 'Ya',
    no: 'Tidak',
    loading: 'Memuat…',
  },
  errors: {
    generic: 'Terjadi kesalahan. Silakan coba lagi.',
    network: 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.',
    bad_request: 'Permintaan tidak dapat diproses.',
    unauthorized: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    forbidden: 'Anda tidak memiliki izin untuk melakukan itu.',
    not_found: 'Kami tidak dapat menemukan yang Anda cari.',
    validation: 'Beberapa informasi yang diberikan tidak valid.',
    server: 'Terjadi kesalahan di pihak kami. Coba lagi sebentar lagi.',
    cancelled: 'Permintaan dibatalkan.',
    unknown: 'Terjadi kesalahan yang tidak terduga.',
  },
  validation: {
    required: 'Kolom ini wajib diisi.',
    fieldRequired: '{{field}} wajib diisi.',
    invalidEmail: 'Masukkan alamat email yang valid.',
    passwordTooShort: 'Kata sandi harus terdiri dari minimal 8 karakter.',
    passwordsDontMatch: 'Kata sandi tidak cocok.',
  },
  language: {
    selectTitle: 'Pilih bahasa Anda',
    selectSubtitle: 'Anda dapat mengubahnya nanti di Pengaturan.',
    continueCta: 'Lanjutkan',
  },
  splash: {
    tagline: 'Puasa · Nutrisi · Aktivitas · Meditasi',
  },
  onboarding: {
    stepProgress: 'Langkah {{step}} dari {{total}}',
    welcome: {
      tagline: 'Kesehatanmu, selaras dengan indah.',
      begin: 'Mulai',
    },
  },
};
