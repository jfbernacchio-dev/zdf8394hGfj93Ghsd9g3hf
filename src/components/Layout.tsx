import Navbar from './Navbar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MobileHeader />
      <main className="animate-fade-in pb-safe lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
