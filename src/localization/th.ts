import { PartialDictionary } from './types';

/** Thai translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const th: PartialDictionary = {
  common: {
    back: 'ย้อนกลับ',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    confirm: 'ยืนยัน',
    continue: 'ดำเนินการต่อ',
    done: 'เสร็จสิ้น',
    save: 'บันทึก',
    saveChanges: 'บันทึกการเปลี่ยนแปลง',
    next: 'ถัดไป',
    skip: 'ข้าม',
    retry: 'ลองอีกครั้ง',
    delete: 'ลบ',
    edit: 'แก้ไข',
    add: 'เพิ่ม',
    remove: 'นำออก',
    ok: 'ตกลง',
    yes: 'ใช่',
    no: 'ไม่ใช่',
    loading: 'กำลังโหลด…',
  },
  errors: {
    generic: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
    network: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง',
    bad_request: 'ไม่สามารถประมวลผลคำขอได้',
    unauthorized: 'เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง',
    forbidden: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
    not_found: 'เราไม่พบสิ่งที่คุณกำลังค้นหา',
    validation: 'ข้อมูลบางส่วนที่ให้มาไม่ถูกต้อง',
    server: 'เกิดข้อผิดพลาดจากฝั่งเรา กรุณาลองใหม่อีกครั้งในภายหลัง',
    cancelled: 'คำขอถูกยกเลิกแล้ว',
    unknown: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
  },
  validation: {
    required: 'จำเป็นต้องกรอกข้อมูลในช่องนี้',
    fieldRequired: 'ต้องระบุ {{field}}',
    invalidEmail: 'กรอกอีเมลที่ถูกต้อง',
    passwordTooShort: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    passwordsDontMatch: 'รหัสผ่านไม่ตรงกัน',
  },
  language: {
    selectTitle: 'เลือกภาษาของคุณ',
    selectSubtitle: 'คุณสามารถเปลี่ยนภายหลังได้ในการตั้งค่า',
    continueCta: 'ดำเนินการต่อ',
  },
  splash: {
    tagline: 'การอดอาหาร · โภชนาการ · กิจกรรม · การทำสมาธิ',
  },
  onboarding: {
    stepProgress: 'ขั้นตอนที่ {{step}} จาก {{total}}',
    welcome: {
      tagline: 'สุขภาพของคุณ อยู่ในความสมดุลที่งดงาม',
      begin: 'เริ่มต้น',
    },
  },
};
