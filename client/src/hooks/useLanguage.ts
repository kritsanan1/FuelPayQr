import { useState, useEffect } from 'react';

export type Language = 'en' | 'th';

interface LanguageHook {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.title': 'FuelPay Pro',
    'nav.logout': 'Logout',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.todaySales': "Today's Sales",
    'dashboard.transactions': 'Transactions',
    'dashboard.pendingPayments': 'Pending Payments',
    'dashboard.fraudAlerts': 'Fraud Alerts',
    'dashboard.qrPayments': 'QR payments',
    'dashboard.awaitingConfirmation': 'Awaiting confirmation',
    'dashboard.allSecure': 'All secure',
    'dashboard.vsYesterday': 'vs yesterday',
    
    // QR Generation
    'qr.title': 'Generate Payment QR',
    'qr.pumpNumber': 'Pump Number',
    'qr.selectPump': 'Select Pump',
    'qr.fuelType': 'Fuel Type',
    'qr.selectFuel': 'Select Fuel',
    'qr.amount': 'Amount (฿)',
    'qr.customerPhone': 'Customer Phone (Optional)',
    'qr.generateButton': 'Generate QR Code',
    'qr.willAppearHere': 'QR Code will appear here',
    'qr.transactionId': 'Transaction ID',
    'qr.awaitingPayment': 'Awaiting Payment',
    
    // Transactions
    'transactions.recent': 'Recent Transactions',
    'transactions.viewAll': 'View All',
    'transactions.id': 'Transaction ID',
    'transactions.pump': 'Pump',
    'transactions.amount': 'Amount',
    'transactions.bank': 'Bank',
    'transactions.status': 'Status',
    'transactions.time': 'Time',
    'transactions.completed': 'Completed',
    'transactions.pending': 'Pending',
    'transactions.failed': 'Failed',
    
    // Banking
    'banking.title': 'Banking APIs',
    'banking.online': 'Online',
    'banking.slow': 'Slow',
    'banking.offline': 'Offline',
    
    // Security
    'security.title': 'Security Status',
    'security.noFraudAlerts': 'No fraud alerts',
    'security.allSystemsSecure': 'All systems secure',
    'security.sslValid': 'SSL certificates valid',
    'security.lastBackup': 'Last backup',
    
    // Quick Actions
    'actions.title': 'Quick Actions',
    'actions.viewAnalytics': 'View Analytics',
    'actions.exportReports': 'Export Reports',
    'actions.systemSettings': 'System Settings',
    
    // Payment Monitor
    'monitor.title': 'Payment Monitor',
    'monitor.completed': 'Completed',
    'monitor.justNow': 'Just now',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.close': 'Close',
  },
  th: {
    // Navigation
    'nav.title': 'FuelPay Pro',
    'nav.logout': 'ออกจากระบบ',
    
    // Dashboard
    'dashboard.title': 'แดชบอร์ด',
    'dashboard.todaySales': 'ยอดขายวันนี้',
    'dashboard.transactions': 'รายการธุรกรรม',
    'dashboard.pendingPayments': 'การชำระเงินรอดำเนินการ',
    'dashboard.fraudAlerts': 'การแจ้งเตือนการฉ้อโกง',
    'dashboard.qrPayments': 'การชำระผ่าน QR',
    'dashboard.awaitingConfirmation': 'รอการยืนยัน',
    'dashboard.allSecure': 'ปลอดภัยทั้งหมด',
    'dashboard.vsYesterday': 'เปรียบเทียบเมื่อวาน',
    
    // QR Generation
    'qr.title': 'สร้าง QR Code สำหรับชำระเงิน',
    'qr.pumpNumber': 'หมายเลขหัวปั๊ม',
    'qr.selectPump': 'เลือกหัวปั๊ม',
    'qr.fuelType': 'ประเภทน้ำมัน',
    'qr.selectFuel': 'เลือกประเภทน้ำมัน',
    'qr.amount': 'จำนวนเงิน (฿)',
    'qr.customerPhone': 'เบอร์โทรลูกค้า (ไม่บังคับ)',
    'qr.generateButton': 'สร้าง QR Code',
    'qr.willAppearHere': 'QR Code จะแสดงที่นี่',
    'qr.transactionId': 'รหัสธุรกรรม',
    'qr.awaitingPayment': 'รอการชำระเงิน',
    
    // Transactions
    'transactions.recent': 'รายการธุรกรรมล่าสุด',
    'transactions.viewAll': 'ดูทั้งหมด',
    'transactions.id': 'รหัสธุรกรรม',
    'transactions.pump': 'หัวปั๊ม',
    'transactions.amount': 'จำนวนเงิน',
    'transactions.bank': 'ธนาคาร',
    'transactions.status': 'สถานะ',
    'transactions.time': 'เวลา',
    'transactions.completed': 'สำเร็จ',
    'transactions.pending': 'รอดำเนินการ',
    'transactions.failed': 'ล้มเหลว',
    
    // Banking
    'banking.title': 'สถานะ Banking APIs',
    'banking.online': 'ออนไลน์',
    'banking.slow': 'ช้า',
    'banking.offline': 'ออฟไลน์',
    
    // Security
    'security.title': 'สถานะความปลอดภัย',
    'security.noFraudAlerts': 'ไม่มีการแจ้งเตือนการฉ้อโกง',
    'security.allSystemsSecure': 'ระบบปลอดภัยทั้งหมด',
    'security.sslValid': 'ใบรับรอง SSL ถูกต้อง',
    'security.lastBackup': 'การสำรองล่าสุด',
    
    // Quick Actions
    'actions.title': 'การดำเนินการด่วน',
    'actions.viewAnalytics': 'ดูการวิเคราะห์',
    'actions.exportReports': 'ส่งออกรายงาน',
    'actions.systemSettings': 'ตั้งค่าระบบ',
    
    // Payment Monitor
    'monitor.title': 'ติดตามการชำระเงิน',
    'monitor.completed': 'สำเร็จ',
    'monitor.justNow': 'เมื่อสักครู่',
    
    // Common
    'common.loading': 'กำลังโหลด...',
    'common.error': 'ข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.cancel': 'ยกเลิก',
    'common.continue': 'ดำเนินการต่อ',
    'common.close': 'ปิด',
  },
};

export function useLanguage(): LanguageHook {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return { language, setLanguage, t };
}
