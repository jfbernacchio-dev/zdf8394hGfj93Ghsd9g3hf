import { useAuth } from '@/contexts/AuthContext';
import mindwareLogo from '@/assets/mindware-logo-new.png';
import { ThemeToggle } from './ThemeToggle';

const MobileHeader = () => {
  const { profile } = useAuth();

  return (
    <header className="lg:hidden bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-40 pt-safe shadow-[var(--shadow-card)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <img src={mindwareLogo} alt="Mindware" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <span className="text-sm text-muted-foreground">
                Olá, {profile.full_name.split(' ')[0]}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
