import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, Menu, TrendingUp, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { useState } from 'react';
import { FileText, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEffectiveIsClinicalProfessional } from '@/lib/roleUtils';

const BottomNav = () => {
  const location = useLocation();
  const { signOut, roleGlobal, isClinicalProfessional } = useAuth();
  const effective = useEffectivePermissions();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Derive flags from new permission system
  const isAdmin = roleGlobal === 'admin';
  const isPsychologist = roleGlobal === 'psychologist';
  const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';
  
  // FASE 3.7: Usar helper central para flag clínica efetiva
  const effectiveIsClinicalProfessional = getEffectiveIsClinicalProfessional(
    roleGlobal,
    isClinicalProfessional
  );

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    setMenuOpen(false);
  };

  const handleMenuNavigation = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Início' },
    { path: '/schedule', icon: Calendar, label: 'Agenda' },
    { path: '/patients', icon: Users, label: 'Pacientes' },
    // WhatsApp apenas se não for subordinado
    ...(!isSubordinate ? [{ path: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' }] : []),
  ];


  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 tap-highlight ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground active:scale-90'
                }`}
              >
                <div className={`transition-all duration-200 ${active ? 'scale-110' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium transition-all ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground active:scale-90 transition-all duration-200 tap-highlight">
                <Menu className="w-5 h-5" />
                <span className="text-xs font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-3xl border-t-0 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="text-xl">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 pb-safe">
                  <div className="border-t border-border my-3" />
                  <Button
                    variant="ghost"
                    className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                    onClick={() => handleMenuNavigation('/financial')}
                  >
                    <TrendingUp className="w-5 h-5 mr-3" />
                    Análise Financeira
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                    onClick={() => handleMenuNavigation('/payment-control')}
                  >
                    <TrendingUp className="w-5 h-5 mr-3" />
                    Controle de Pagamentos
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                    onClick={() => handleMenuNavigation('/nfse/config')}
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    NFSe - Configuração
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                    onClick={() => handleMenuNavigation('/nfse/history')}
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    NFSe - Histórico
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                    onClick={() => handleMenuNavigation('/invoice-logs')}
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    Fechamentos
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                    onClick={() => handleMenuNavigation('/metrics/website')}
                  >
                    <TrendingUp className="w-5 h-5 mr-3" />
                    Métricas
                  </Button>
                  <div className="border-t border-border my-3" />
                  {(isAdmin || effectiveIsClinicalProfessional) && (
                    <Button
                      variant="ghost"
                      className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                      onClick={() => handleMenuNavigation('/team-management')}
                    >
                      <Users className="w-5 h-5 mr-3" />
                      Equipe
                    </Button>
                  )}
                  {isAdmin && !isSubordinate && (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                        onClick={() => handleMenuNavigation('/admin/security')}
                      >
                        <Shield className="w-5 h-5 mr-3" />
                        Segurança
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start h-14 text-base rounded-xl active:scale-98 transition-transform"
                        onClick={() => handleMenuNavigation('/org-management')}
                      >
                        <Users className="w-5 h-5 mr-3" />
                        Gestão Organizacional
                      </Button>
                    </>
                  )}
                  <div className="border-t border-border my-3" />
                <Button
                  variant="ghost"
                  className="justify-start h-14 text-base text-destructive hover:text-destructive rounded-xl active:scale-98 transition-transform"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default BottomNav;
