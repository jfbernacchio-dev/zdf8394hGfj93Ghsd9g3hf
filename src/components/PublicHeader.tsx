import { Button } from "@/components/ui/button";
import { Instagram, Youtube, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const PublicHeader = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 left-0 right-0 bg-white backdrop-blur-sm z-50 border-b shadow-sm" style={{ borderColor: '#E8E4D9', height: '142px' }}>
      <div className="flex items-center justify-between px-6 h-full" style={{ maxWidth: '1920px', margin: '0 auto' }}>
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/">
            <img src="/images/mindware-logo-color.png" alt="Espaço Mindware" style={{ height: '70px', width: 'auto' }} />
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="hidden lg:flex items-center h-full">
          <Link 
            to="/#inicio" 
            className={`relative flex items-center h-full px-4 hover:opacity-80 transition-opacity border-t-[3px] ${
              isActive('/') ? 'border-[#6A7567]' : 'border-transparent'
            }`}
            style={{ fontSize: '14px', fontWeight: isActive('/') ? 700 : 500, color: '#6A7567' }}
          >
            INÍCIO
          </Link>
          <div className="relative group h-full flex items-center">
            <button 
              className={`h-full px-4 hover:opacity-80 transition-opacity border-t-[3px] ${
                isActive('/servicos') ? 'border-[#6A7567]' : 'border-transparent'
              }`}
              style={{ fontSize: '14px', fontWeight: isActive('/servicos') ? 700 : 500, color: '#6A7567' }}
            >
              SERVIÇOS
            </button>
            <div className="absolute left-0 top-full w-72 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <Link to="/servicos/terapia-cognitiva-comportamental" className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: '#6A7567' }}>
                Terapia Cognitivo-Comportamental
              </Link>
              <Link to="/servicos/terapia-junguiana" className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: '#6A7567' }}>
                Terapia Junguiana
              </Link>
              <Link to="/servicos/terapia-infantil" className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style={{ color: '#6A7567' }}>
                Terapia Infantil
              </Link>
            </div>
          </div>
          <Link 
            to="/sobre-nos" 
            className={`relative flex items-center h-full px-4 hover:opacity-80 transition-opacity border-t-[3px] ${
              isActive('/sobre-nos') ? 'border-[#6A7567]' : 'border-transparent'
            }`}
            style={{ fontSize: '14px', fontWeight: isActive('/sobre-nos') ? 700 : 500, color: '#6A7567' }}
          >
            SOBRE NÓS
          </Link>
          <Link 
            to="/o-espaco" 
            className={`relative flex items-center h-full px-4 hover:opacity-80 transition-opacity border-t-[3px] ${
              isActive('/o-espaco') ? 'border-[#6A7567]' : 'border-transparent'
            }`}
            style={{ fontSize: '14px', fontWeight: isActive('/o-espaco') ? 700 : 500, color: '#6A7567' }}
          >
            O ESPAÇO
          </Link>
          <a 
            href="/#curso" 
            className="relative flex items-center h-full px-4 hover:opacity-80 transition-opacity border-t-[3px] border-transparent"
            style={{ fontSize: '14px', fontWeight: 500, color: '#6A7567' }}
          >
            CURSO DE MÃES
          </a>
          <a 
            href="/#contato" 
            className="relative flex items-center h-full px-4 hover:opacity-80 transition-opacity border-t-[3px] border-transparent"
            style={{ fontSize: '14px', fontWeight: 500, color: '#6A7567' }}
          >
            CONTATO
          </a>
        </nav>
        
        {/* Social Icons */}
        <div className="flex items-center gap-3">
          <a href="https://wa.me/5511988802007" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <Phone style={{ width: '20px', height: '20px', color: '#6A7567' }} />
          </a>
          <a href="https://instagram.com/espacomindware" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <Instagram style={{ width: '20px', height: '20px', color: '#6A7567' }} />
          </a>
          <a href="https://youtube.com/@espacomindware" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <Youtube style={{ width: '20px', height: '20px', color: '#6A7567' }} />
          </a>
          <Button variant="ghost" size="sm" asChild className="ml-2">
            <Link to="/login" style={{ color: '#6A7567', fontSize: '14px' }}>Acesso</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
