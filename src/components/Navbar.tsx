import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Calendar, LogOut, FileText, ChevronDown, Shield, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useState } from 'react';
import mindwareLogo from '@/assets/mindware-logo.png';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-card shadow-[var(--shadow-card)] border-b border-border sticky top-0 z-50 pt-safe hidden lg:block">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-background flex items-center justify-center">
              <img src={mindwareLogo} alt="Mindware Clinic" className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-base md:text-xl font-semibold text-foreground">Mindware Clinic</span>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link
                to="/schedule"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/schedule')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Agenda</span>
              </Link>
              <Link
                to="/patients"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/patients')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">Pacientes</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/therapists"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/therapists')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Terapeutas</span>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      location.pathname.startsWith('/nfse')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">NFSe</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover z-50">
                  <DropdownMenuItem onClick={() => navigate('/nfse/config')}>
                    Configuração
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/nfse/history')}>
                    Histórico
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
              {profile && (
                <span className="text-sm text-muted-foreground">
                  {profile.full_name.split(' ')[0]}
                </span>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/security')}
                  title="Configurações de Segurança"
                >
                  <Shield className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
