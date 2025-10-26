import { useAuth } from '@/contexts/AuthContext';
import mindwareLogo from '@/assets/mindware-logo.png';

const MobileHeader = () => {
  const { profile } = useAuth();

  return (
    <header className="lg:hidden bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-40 pt-safe shadow-[var(--shadow-card)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
              <img src={mindwareLogo} alt="Mindware" className="w-6 h-6" />
            </div>
            <span className="text-base font-semibold text-foreground">Mindware</span>
          </div>
          {profile && (
            <span className="text-sm text-muted-foreground">
              Olá, {profile.full_name.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
