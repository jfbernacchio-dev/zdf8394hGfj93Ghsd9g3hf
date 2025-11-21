import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Calendar, LogOut, FileText, ChevronDown, Shield, Menu, TrendingUp, User, AlertTriangle, Database, ClipboardCheck, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useState } from 'react';
import mindwareLogo from '@/assets/mindware-logo-new.png';
import { NotificationCenter } from './NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import { OrganizationSwitcher } from './OrganizationSwitcher';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, isAdmin, isAccountant, roleGlobal } = useAuth();
  const effective = useEffectivePermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive legacy flags from new permission system
  const isFullTherapist = roleGlobal === 'psychologist';
  const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';

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
          <div className="flex items-center justify-center py-2 mr-4">
            <img src={mindwareLogo} alt="Mindware Clinic" className="h-10 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Dashboard</span>
              </Link>
              
              {!isAccountant && (
                <>
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
                  {!isAccountant && !isSubordinate && (
                    <Link
                      to="/whatsapp"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive('/whatsapp')
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-medium">WhatsApp</span>
                    </Link>
                  )}
                  {(isAdmin || isFullTherapist) && (
                    <Link
                      to="/team-management"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive('/team-management')
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Equipe</span>
                    </Link>
                  )}
                  {!isAccountant && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            location.pathname.startsWith('/financial') || location.pathname.startsWith('/metrics')
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium">Métricas</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover z-50">
                        <DropdownMenuItem onClick={() => navigate('/financial')}>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Análise Financeira
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/metrics/website')}>
                          <FileText className="w-4 h-4 mr-2" />
                          Website
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
              {!isAccountant && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        location.pathname.startsWith('/nfse') || location.pathname.startsWith('/invoice-logs') || location.pathname === '/payment-control'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Financeiro</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover z-50">
                    <DropdownMenuItem onClick={() => navigate('/payment-control')}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Controle de Pagamentos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FileText className="w-4 h-4 mr-2" />
                        NFSe
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-popover">
                        <DropdownMenuItem onClick={() => navigate('/nfse/config')}>
                          Configuração
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/nfse/history')}>
                          Histórico
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/invoice-logs')}>
                      Fechamentos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
              {profile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      {profile.full_name.split(' ')[0]}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover z-50">
                    <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                      <User className="w-4 h-4 mr-2" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ThemeToggle />
              <OrganizationSwitcher />
              {!isAccountant && <NotificationCenter />}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Segurança & Compliance"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover z-50">
                    <DropdownMenuItem onClick={() => navigate('/admin/security')}>
                      <Shield className="w-4 h-4 mr-2" />
                      MFA / 2FA
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin/incidents')}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Gestão de Incidentes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/audit-logs')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Logs de Auditoria
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin/log-review')}>
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      Revisão de Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/permission-review')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Revisão de Permissões
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/org-management')}>
                      <Users className="w-4 h-4 mr-2" />
                      Gestão Organizacional
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/permission-review')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Revisão de Permissões
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin/backup-tests')}>
                      <Database className="w-4 h-4 mr-2" />
                      Testes de Backup
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
