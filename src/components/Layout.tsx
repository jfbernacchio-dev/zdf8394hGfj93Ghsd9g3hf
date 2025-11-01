import Navbar from './Navbar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import Footer from './Footer';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MobileHeader />
      <main className="animate-fade-in pb-safe lg:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Layout;
