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
    <nav className="bg-card shadow-[var(--shadow-card)] border-b border-border sticky top-0 z-50 pt-safe">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 pt-2 md:pt-0">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-background flex items-center justify-center">
              <img src={mindwareLogo} alt="Mindware Clinic" className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-base md:text-xl font-semibold text-foreground">Mindware Clinic</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
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

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {profile && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {profile.full_name.split(' ')[0]}
              </span>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => handleNavigation('/')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant={isActive('/schedule') ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => handleNavigation('/schedule')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agenda
                  </Button>
                  <Button
                    variant={isActive('/patients') ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => handleNavigation('/patients')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Pacientes
                  </Button>
                  {isAdmin && (
                    <Button
                      variant={isActive('/therapists') ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => handleNavigation('/therapists')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Terapeutas
                    </Button>
                  )}
                  <div className="border-t border-border my-2" />
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => handleNavigation('/nfse/config')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    NFSe - Configuração
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => handleNavigation('/nfse/history')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    NFSe - Histórico
                  </Button>
                  {isAdmin && (
                    <>
                      <div className="border-t border-border my-2" />
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => handleNavigation('/admin/security')}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Segurança
                      </Button>
                    </>
                  )}
                  <div className="border-t border-border my-2" />
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
