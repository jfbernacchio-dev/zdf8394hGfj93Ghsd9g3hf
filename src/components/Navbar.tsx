import { Link, useLocation } from 'react-router-dom';
import { Brain, Users, Calendar } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card shadow-[var(--shadow-card)] border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">PsiClinic</span>
          </div>

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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
