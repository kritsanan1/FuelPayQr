export const fuelTypes = {
  en: {
    gasohol95: 'Gasohol 95',
    gasohol91: 'Gasohol 91',
    e20: 'E20',
    e85: 'E85',
    diesel: 'Diesel',
    premium: 'Premium 95',
  },
  th: {
    gasohol95: 'แก๊สโซฮอล์ 95',
    gasohol91: 'แก๊สโซฮอล์ 91',
    e20: 'E20',
    e85: 'E85',
    diesel: 'ดีเซล',
    premium: 'เบนซิน 95',
  },
};

export const banks = {
  en: {
    promptpay: 'PromptPay',
    bbl: 'Bangkok Bank',
    scb: 'SCB',
    kasikorn: 'Kasikornbank',
  },
  th: {
    promptpay: 'พร้อมเพย์',
    bbl: 'ธนาคารกรุงเทพ',
    scb: 'ธนาคารไทยพาณิชย์',
    kasikorn: 'ธนาคารกสิกรไทย',
  },
};

export const formatCurrency = (amount: number, locale: string = 'th-TH'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDateTime = (date: Date | string, locale: string = 'th-TH'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};
