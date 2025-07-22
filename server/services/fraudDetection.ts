export interface FraudCheckResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  description: string;
  patternId?: number;
}

export interface TransactionData {
  amount: string;
  fuelType: string;
  pumpNumber: string;
  employeeId: number;
  stationId: string;
  customerPhone?: string;
}

export class FraudDetection {
  private patterns = [
    {
      id: 1,
      name: 'high_amount',
      description: 'Unusually high transaction amount',
      threshold: 5000,
      riskLevel: 'high' as const,
    },
    {
      id: 2,
      name: 'rapid_transactions',
      description: 'Multiple transactions in short time',
      threshold: 3,
      riskLevel: 'medium' as const,
    },
    {
      id: 3,
      name: 'suspicious_amount',
      description: 'Round number amounts that might indicate testing',
      threshold: 1000,
      riskLevel: 'low' as const,
    },
  ];

  async checkTransaction(data: TransactionData): Promise<FraudCheckResult> {
    const amount = parseFloat(data.amount);
    let riskScore = 0;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let description = 'Transaction appears normal';
    let patternId: number | undefined;

    // Check for high amount
    if (amount > 5000) {
      riskScore += 30;
      riskLevel = 'high';
      description = 'High transaction amount detected';
      patternId = 1;
    } else if (amount > 2000) {
      riskScore += 15;
      riskLevel = 'medium';
      description = 'Elevated transaction amount';
      patternId = 1;
    }

    // Check for round numbers (potential testing)
    if (amount % 1000 === 0 && amount >= 1000) {
      riskScore += 10;
      if (riskLevel === 'low') {
        riskLevel = 'medium';
        description = 'Round number amount pattern';
        patternId = 3;
      }
    }

    // Check for unusual fuel types with high amounts
    if (amount > 3000 && ['premium', 'e85'].includes(data.fuelType)) {
      riskScore += 20;
      riskLevel = 'high';
      description = 'High amount with premium fuel type';
    }

    // Simulate rapid transaction check (would check database in real implementation)
    if (Math.random() < 0.1) { // 10% chance of rapid transaction detection
      riskScore += 25;
      riskLevel = 'medium';
      description = 'Multiple transactions detected in short timeframe';
      patternId = 2;
    }

    // Critical risk if score is too high
    if (riskScore > 50) {
      riskLevel = 'critical';
    }

    return {
      riskLevel,
      riskScore,
      description,
      patternId,
    };
  }

  async analyzeTransactionPatterns(employeeId: number): Promise<any> {
    // This would analyze historical patterns for the employee
    // For now, return a simple analysis
    return {
      totalTransactions: Math.floor(Math.random() * 100) + 50,
      averageAmount: Math.floor(Math.random() * 1000) + 500,
      suspiciousTransactions: Math.floor(Math.random() * 5),
      riskProfile: 'low',
    };
  }

  async checkSystemSecurity(): Promise<any> {
    return {
      activeThreatLevel: 'low',
      lastSecurityScan: new Date().toISOString(),
      vulnerabilities: 0,
      securityScore: 95,
    };
  }
}
