import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  TrendingUp,
  Upload,
  Store,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = user ? [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Submit Project', href: '/submit-project', icon: FileText },
    ...(profile?.role === 'verifier' ? [{ name: 'Verification', href: '/verification', icon: CheckCircle }] : []),
    { name: 'Carbon Tracker', href: '/carbon-tracker', icon: TrendingUp },
    { name: 'Mobile Upload', href: '/mobile-upload', icon: Upload },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl font-bold">
              BlueCarbon Credits
            </Link>

            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm">
                  Welcome, {profile?.full_name || user.email}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  // variant="" 
                  size="sm"
                  onClick={() => navigate('/signup')}
                  className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {user && (
          <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-card border-r min-h-screen`}>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className={`flex-1 ${user ? 'p-6' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;