import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Fuel, ChevronDown, BarChart3, History, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { path: "/", label: t('dashboard.title'), icon: BarChart3 },
    { path: "/analytics", label: t('actions.viewAnalytics'), icon: BarChart3 },
    { path: "/transactions", label: "Transaction History", icon: History },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-petrol-blue rounded-lg flex items-center justify-center">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-poppins font-bold text-petrol-blue">
                  {t('nav.title')}
                </h1>
                <p className="text-xs text-gray-500">Station #001 - Sukhumvit</p>
              </div>
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-petrol-blue bg-petrol-blue bg-opacity-10'
                        : 'text-gray-600 hover:text-petrol-blue hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
            
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Station Manager</p>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('actions.systemSettings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
