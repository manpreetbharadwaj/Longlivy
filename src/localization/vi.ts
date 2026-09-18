import { PartialDictionary } from './types';

/** Vietnamese translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const vi: PartialDictionary = {
  common: {
    back: 'Quay lại',
    cancel: 'Hủy',
    close: 'Đóng',
    confirm: 'Xác nhận',
    continue: 'Tiếp tục',
    done: 'Xong',
    save: 'Lưu',
    saveChanges: 'Lưu thay đổi',
    next: 'Tiếp theo',
    skip: 'Bỏ qua',
    retry: 'Thử lại',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    add: 'Thêm',
    remove: 'Xóa',
    ok: 'Đồng ý',
    yes: 'Có',
    no: 'Không',
    loading: 'Đang tải…',
  },
  errors: {
    generic: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    network: 'Không thể kết nối đến máy chủ. Kiểm tra kết nối của bạn và thử lại.',
    bad_request: 'Không thể xử lý yêu cầu.',
    unauthorized: 'Phiên của bạn đã hết hạn. Vui lòng đăng nhập lại.',
    forbidden: 'Bạn không có quyền thực hiện việc này.',
    not_found: 'Chúng tôi không tìm thấy nội dung bạn tìm kiếm.',
    validation: 'Một số thông tin cung cấp không hợp lệ.',
    server: 'Đã có lỗi xảy ra từ phía chúng tôi. Vui lòng thử lại sau.',
    cancelled: 'Yêu cầu đã bị hủy.',
    unknown: 'Đã xảy ra lỗi không mong muốn.',
  },
  validation: {
    required: 'Trường này là bắt buộc.',
    fieldRequired: '{{field}} là bắt buộc.',
    invalidEmail: 'Nhập địa chỉ email hợp lệ.',
    passwordTooShort: 'Mật khẩu phải có ít nhất 8 ký tự.',
    passwordsDontMatch: 'Mật khẩu không khớp.',
  },
  language: {
    selectTitle: 'Chọn ngôn ngữ của bạn',
    selectSubtitle: 'Bạn có thể thay đổi sau trong Cài đặt.',
    continueCta: 'Tiếp tục',
  },
  splash: {
    tagline: 'Nhịn ăn · Dinh dưỡng · Hoạt động · Thiền',
  },
  onboarding: {
    stepProgress: 'Bước {{step}}/{{total}}',
    welcome: {
      tagline: 'Sức khỏe của bạn, hài hòa trọn vẹn.',
      begin: 'Bắt đầu',
    },
  },
};
