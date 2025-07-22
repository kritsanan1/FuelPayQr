import QRCode from 'qrcode';

export interface QRGenerationData {
  transactionId: string;
  amount: number;
  bankProvider: string;
  merchantId: string;
}

export interface QRResult {
  qrCode: string;
  data: any;
}

export class QRGenerator {
  async generateQR(data: QRGenerationData): Promise<QRResult> {
    try {
      const qrData = this.formatQRData(data);
      const qrCode = await QRCode.toDataURL(qrData.payload, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
      });

      return {
        qrCode,
        data: qrData,
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  private formatQRData(data: QRGenerationData): any {
    const { transactionId, amount, bankProvider, merchantId } = data;

    switch (bankProvider) {
      case 'promptpay':
        return this.generatePromptPayQR(data);
      case 'bbl':
        return this.generateBangkokBankQR(data);
      case 'scb':
        return this.generateSCBQR(data);
      case 'kasikorn':
        return this.generateKasikornQR(data);
      default:
        return this.generatePromptPayQR(data);
    }
  }

  private generatePromptPayQR(data: QRGenerationData): any {
    const { transactionId, amount, merchantId } = data;
    
    // PromptPay QR format (simplified)
    const payload = {
      version: '01',
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount.toFixed(2),
      currency: 'THB',
      country: 'TH',
    };

    return {
      format: 'promptpay',
      payload: JSON.stringify(payload),
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount,
      currency: 'THB',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  private generateBangkokBankQR(data: QRGenerationData): any {
    const { transactionId, amount, merchantId } = data;
    
    const payload = {
      bank: 'bbl',
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount.toFixed(2),
      currency: 'THB',
      reference: `BBL${transactionId}`,
    };

    return {
      format: 'bangkok_bank',
      payload: JSON.stringify(payload),
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount,
      currency: 'THB',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  private generateSCBQR(data: QRGenerationData): any {
    const { transactionId, amount, merchantId } = data;
    
    const payload = {
      bank: 'scb',
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount.toFixed(2),
      currency: 'THB',
      reference: `SCB${transactionId}`,
    };

    return {
      format: 'scb',
      payload: JSON.stringify(payload),
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount,
      currency: 'THB',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  private generateKasikornQR(data: QRGenerationData): any {
    const { transactionId, amount, merchantId } = data;
    
    const payload = {
      bank: 'kasikorn',
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount.toFixed(2),
      currency: 'THB',
      reference: `KBANK${transactionId}`,
    };

    return {
      format: 'kasikorn',
      payload: JSON.stringify(payload),
      merchant_id: merchantId,
      transaction_id: transactionId,
      amount: amount,
      currency: 'THB',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }
}
