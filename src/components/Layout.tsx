import Navbar from './Navbar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <div className="lg:hidden">
        <MobileHeader />
      </div>
      <main className="animate-fade-in pb-safe lg:pb-0">
        {children}
      </main>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;
