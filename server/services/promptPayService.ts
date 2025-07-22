import QRCode from 'qrcode';
import { BankingService } from './bankingService';

export interface PromptPayQRData {
  amount: number;
  merchantId: string;
  transactionRef: string;
  billerId?: string;
  phoneNumber?: string;
  nationalId?: string;
}

export interface PromptPayGenerationResult {
  qrCode: string;
  qrData: any;
  paymentUrl?: string;
  expiresAt: Date;
}

export class PromptPayService {
  private static readonly COUNTRY_CODE = 'TH';
  private static readonly MERCHANT_CATEGORY_CODE = '5542'; // Fuel stations
  private static readonly CURRENCY_CODE = '764'; // Thai Baht
  
  async generatePromptPayQR(data: PromptPayQRData): Promise<PromptPayGenerationResult> {
    try {
      // Generate EMV QR Code standard payload for PromptPay
      const payload = this.generateEMVPayload(data);
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Calculate expiration (15 minutes for fuel station payments)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      return {
        qrCode,
        qrData: {
          payload,
          amount: data.amount,
          merchantId: data.merchantId,
          transactionRef: data.transactionRef,
          paymentMethod: 'promptpay',
          generatedAt: new Date(),
        },
        expiresAt
      };
    } catch (error) {
      console.error('PromptPay QR generation error:', error);
      throw new Error(`Failed to generate PromptPay QR: ${error.message}`);
    }
  }

  private generateEMVPayload(data: PromptPayQRData): string {
    // EMV QR Code specification for PromptPay
    let payload = '';
    
    // Payload Format Indicator (Tag 00)
    payload += this.formatTLV('00', '01');
    
    // Point of Initiation Method (Tag 01) - Static QR
    payload += this.formatTLV('01', '12');
    
    // Merchant Account Information (Tag 29 - PromptPay)
    const promptPayData = this.generatePromptPayData(data);
    payload += this.formatTLV('29', promptPayData);
    
    // Merchant Category Code (Tag 52)
    payload += this.formatTLV('52', PromptPayService.MERCHANT_CATEGORY_CODE);
    
    // Transaction Currency (Tag 53) - Thai Baht
    payload += this.formatTLV('53', PromptPayService.CURRENCY_CODE);
    
    // Transaction Amount (Tag 54)
    payload += this.formatTLV('54', data.amount.toFixed(2));
    
    // Country Code (Tag 58)
    payload += this.formatTLV('58', PromptPayService.COUNTRY_CODE);
    
    // Merchant Name (Tag 59)
    payload += this.formatTLV('59', 'GasPay Station');
    
    // Merchant City (Tag 60)
    payload += this.formatTLV('60', 'Bangkok');
    
    // Additional Data Field Template (Tag 62)
    const additionalData = this.generateAdditionalData(data);
    payload += this.formatTLV('62', additionalData);
    
    // Calculate and append CRC (Tag 63)
    const crc = this.calculateCRC16(payload + '6304');
    payload += '63' + '04' + crc;
    
    return payload;
  }

  private generatePromptPayData(data: PromptPayQRData): string {
    let promptPayPayload = '';
    
    // Globally Unique Identifier (Tag 00)
    promptPayPayload += this.formatTLV('00', 'A000000677010111');
    
    // PromptPay ID (Tag 01) - Use phone number or national ID
    const promptPayId = data.phoneNumber || data.nationalId || data.merchantId;
    promptPayPayload += this.formatTLV('01', promptPayId);
    
    return promptPayPayload;
  }

  private generateAdditionalData(data: PromptPayQRData): string {
    let additionalData = '';
    
    // Bill Number (Tag 01)
    additionalData += this.formatTLV('01', data.transactionRef);
    
    // Store Label (Tag 03)
    additionalData += this.formatTLV('03', 'FUEL');
    
    // Terminal Label (Tag 07)
    additionalData += this.formatTLV('07', 'POS01');
    
    return additionalData;
  }

  private formatTLV(tag: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return tag + length + value;
  }

  private calculateCRC16(data: string): string {
    const polynomial = 0x1021;
    let crc = 0xFFFF;
    
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8);
      
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // Verify PromptPay payment status
  async verifyPayment(transactionRef: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'expired';
    amount?: number;
    timestamp?: Date;
    bankReference?: string;
  }> {
    try {
      // In real implementation, this would call PromptPay API
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate random payment completion for demo
      const isCompleted = Math.random() > 0.7;
      
      return {
        status: isCompleted ? 'completed' : 'pending',
        timestamp: isCompleted ? new Date() : undefined,
        bankReference: isCompleted ? `PP${Date.now()}` : undefined
      };
    } catch (error) {
      console.error('PromptPay verification error:', error);
      return { status: 'failed' };
    }
  }

  // Get PromptPay service status
  async getServiceStatus(): Promise<{
    status: 'online' | 'offline' | 'maintenance';
    responseTime?: number;
    lastChecked: Date;
  }> {
    const startTime = Date.now();
    
    try {
      // Simulate API health check
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        status: 'online',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'offline',
        lastChecked: new Date()
      };
    }
  }
}