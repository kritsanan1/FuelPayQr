import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, QrCode, Shield, BarChart3 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function Landing() {
  const { language, setLanguage, t } = useLanguage();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-light-blue-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-petrol-blue rounded-lg flex items-center justify-center">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-poppins font-bold text-petrol-blue">FuelPay Pro</h1>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-white text-petrol-blue shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('th')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  language === 'th'
                    ? 'bg-white text-petrol-blue shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                ไทย
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-poppins font-bold text-gray-900 mb-6">
            {language === 'en' ? 'Professional QR Payment System' : 'ระบบชำระเงิน QR แบบมืออาชีพ'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {language === 'en' 
              ? 'Secure, fast, and reliable QR code payment processing for Thai gas stations with multi-bank support and real-time fraud detection.'
              : 'ระบบประมวลผลการชำระเงิน QR Code ที่ปลอดภัย รวดเร็ว และเชื่อถือได้ สำหรับปั๊มน้ำมันไทย พร้อมการรองรับธนาคารหลายแห่งและการตรวจจับการฉ้อโกงแบบเรียลไทม์'
            }
          </p>
          
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-petrol-blue hover:bg-petrol-blue/90 text-white px-8 py-3 text-lg font-poppins font-semibold"
          >
            {language === 'en' ? 'Employee Login' : 'เข้าสู่ระบบพนักงาน'}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-petrol-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-6 w-6 text-petrol-blue" />
              </div>
              <h3 className="text-lg font-poppins font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'QR Generation' : 'สร้าง QR Code'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' 
                  ? 'Instant QR code generation with Thai banking standards'
                  : 'สร้าง QR Code ทันทีตามมาตรฐานธนาคารไทย'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-success-green bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Fuel className="h-6 w-6 text-success-green" />
              </div>
              <h3 className="text-lg font-poppins font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Multi-Bank Support' : 'รองรับหลายธนาคาร'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' 
                  ? 'Integration with PromptPay, Bangkok Bank, SCB, and Kasikornbank'
                  : 'เชื่อมต่อกับพร้อมเพย์ กรุงเทพ ไทยพาณิชย์ และกสิกรไทย'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-fire-red bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-fire-red" />
              </div>
              <h3 className="text-lg font-poppins font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Fraud Detection' : 'ตรวจจับการฉ้อโกง'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' 
                  ? 'Real-time fraud monitoring and suspicious pattern detection'
                  : 'ติดตามการฉ้อโกงแบบเรียลไทม์และตรวจจับรูปแบบต้องสงสัย'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-warning-yellow bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-warning-yellow" />
              </div>
              <h3 className="text-lg font-poppins font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Analytics' : 'การวิเคราะห์'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' 
                  ? 'Comprehensive transaction analytics and reporting tools'
                  : 'เครื่องมือวิเคราะห์และรายงานธุรกรรมที่ครอบคลุม'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="bg-gradient-to-r from-petrol-blue to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-poppins font-bold mb-4">
              {language === 'en' ? 'Enterprise-Grade Security' : 'ความปลอดภัยระดับองค์กร'}
            </h3>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Built with Thai financial regulations compliance, SSL encryption, and automated backup systems to ensure your transactions are always secure.'
                : 'สร้างขึ้นตามกฎระเบียบทางการเงินของไทย การเข้ารหัส SSL และระบบสำรองข้อมูลอัตโนมัติเพื่อให้แน่ใจว่าธุรกรรมของคุณปลอดภัยเสมอ'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
