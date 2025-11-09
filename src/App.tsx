import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DashboardOLD from "./pages/DashboardOLD";
import Financial from "./pages/Financial";
import Index from "./pages/Index";
import TerapiaCognitivaComportamental from "./pages/TerapiaCognitivaComportamental";
import TerapiaJunguiana from "./pages/TerapiaJunguiana";
import TerapiaInfantil from "./pages/TerapiaInfantil";
import SobreNos from "./pages/SobreNos";
import OEspaco from "./pages/OEspaco";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import EditPatient from "./pages/EditPatient";
import PatientDetail from "./pages/PatientDetail";
import PatientDetailOLD from "./pages/PatientDetailOLD";
import Schedule from "./pages/Schedule";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import TherapistManagement from "./pages/TherapistManagement";
import CreateTherapist from "./pages/CreateTherapist";
import TherapistDetail from "./pages/TherapistDetail";
import NFSeConfig from "./pages/NFSeConfig";
import NFSeHistory from "./pages/NFSeHistory";
import InvoiceLogs from "./pages/InvoiceLogs";
import PaymentControl from "./pages/PaymentControl";
import AdminSettings from "./pages/AdminSettings";
import ProfileEdit from "./pages/ProfileEdit";
import Install from "./pages/Install";
import AuditLogs from "./pages/AuditLogs";
import SecurityIncidents from "./pages/SecurityIncidents";
import LogReview from "./pages/LogReview";
import PermissionReview from "./pages/PermissionReview";
import BackupTests from "./pages/BackupTests";
import ConsentForm from "./pages/ConsentForm";
import WhatsAppChat from "./pages/WhatsAppChat";
import WebsiteMetrics from "./pages/WebsiteMetrics";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[var(--gradient-soft)] flex items-center justify-center">
      <p className="text-muted-foreground">Carregando...</p>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[var(--gradient-soft)] flex items-center justify-center">
      <p className="text-muted-foreground">Carregando...</p>
    </div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Landing Page Pública */}
            <Route path="/" element={<Index />} />
            
            {/* Páginas de Serviços Públicas */}
            <Route path="/servicos/terapia-cognitiva-comportamental" element={<TerapiaCognitivaComportamental />} />
            <Route path="/servicos/terapia-junguiana" element={<TerapiaJunguiana />} />
            <Route path="/servicos/terapia-infantil" element={<TerapiaInfantil />} />
            <Route path="/sobre-nos" element={<SobreNos />} />
            <Route path="/o-espaco" element={<OEspaco />} />
            
            {/* Formulário Público de Consentimento - DEVE estar antes das rotas protegidas */}
            <Route path="/consent/:token" element={<ConsentForm />} />
            <Route path="/consent-form/:token" element={<ConsentForm />} />
            
            {/* Sistema de Gestão */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/dashboard-old" element={<ProtectedRoute><Layout><DashboardOLD /></Layout></ProtectedRoute>} />
            <Route path="/install" element={<Install />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            
            <Route path="/financial" element={<ProtectedRoute><Layout><Financial /></Layout></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><Layout><Patients /></Layout></ProtectedRoute>} />
            <Route path="/patients/new" element={<ProtectedRoute><Layout><NewPatient /></Layout></ProtectedRoute>} />
            <Route path="/patients/:id/edit" element={<ProtectedRoute><Layout><EditPatient /></Layout></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><Layout><PatientDetail /></Layout></ProtectedRoute>} />
            <Route path="/patient-old/:id" element={<ProtectedRoute><Layout><PatientDetailOLD /></Layout></ProtectedRoute>} />
            <Route path="/therapists" element={<ProtectedRoute><Layout><TherapistManagement /></Layout></ProtectedRoute>} />
            <Route path="/therapists/:id" element={<ProtectedRoute><Layout><TherapistDetail /></Layout></ProtectedRoute>} />
            <Route path="/create-therapist" element={<ProtectedRoute><Layout><CreateTherapist /></Layout></ProtectedRoute>} />
            <Route path="/nfse/config" element={<ProtectedRoute><Layout><NFSeConfig /></Layout></ProtectedRoute>} />
            <Route path="/nfse/history" element={<ProtectedRoute><Layout><NFSeHistory /></Layout></ProtectedRoute>} />
            <Route path="/invoice-logs" element={<ProtectedRoute><Layout><InvoiceLogs /></Layout></ProtectedRoute>} />
            <Route path="/payment-control" element={<ProtectedRoute><Layout><PaymentControl /></Layout></ProtectedRoute>} />
            <Route path="/admin/security" element={<ProtectedRoute><Layout><AdminSettings /></Layout></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute><Layout><AuditLogs /></Layout></ProtectedRoute>} />
            <Route path="/admin/incidents" element={<ProtectedRoute><Layout><SecurityIncidents /></Layout></ProtectedRoute>} />
            <Route path="/admin/log-review" element={<ProtectedRoute><Layout><LogReview /></Layout></ProtectedRoute>} />
            <Route path="/admin/permission-review" element={<ProtectedRoute><Layout><PermissionReview /></Layout></ProtectedRoute>} />
            <Route path="/admin/backup-tests" element={<ProtectedRoute><Layout><BackupTests /></Layout></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><Layout><ProfileEdit /></Layout></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute><Layout><WhatsAppChat /></Layout></ProtectedRoute>} />
            <Route path="/metrics/website" element={<ProtectedRoute><Layout><WebsiteMetrics /></Layout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
