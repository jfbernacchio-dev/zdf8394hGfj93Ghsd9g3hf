import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { PermissionRoute } from "./components/PermissionRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DashboardExample from "./pages/DashboardExample";
import DashboardOLD from "./pages/DashboardOLD";
import AccountantDashboard from "./pages/AccountantDashboard";
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
import TeamManagement from "./pages/TeamManagement";
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
import PermissionManagement from "./pages/PermissionManagement";
import LevelPermissionsManagement from "./pages/LevelPermissionsManagement";
import PeerSharingManagement from "./pages/PeerSharingManagement";
import MigrationWizard from "./pages/MigrationWizard";
import Organogram from "./pages/Organogram";
import OrgManagement from "./pages/OrgManagement";
import BackupTests from "./pages/BackupTests";
import ConsentForm from "./pages/ConsentForm";
import WhatsAppChat from "./pages/WhatsAppChat";
import WebsiteMetrics from "./pages/WebsiteMetrics";
import ClinicalComplaintForm from "./pages/ClinicalComplaintForm";
import SessionEvaluationForm from "./pages/SessionEvaluationForm";
import SetupOrganization from "./pages/SetupOrganization";

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

const DashboardRoute = () => {
  const { isAccountant } = useAuth();
  return isAccountant ? <AccountantDashboard /> : <Dashboard />;
};

const ClinicalRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAccountant } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAccountant) {
      navigate("/accountant-dashboard", { replace: true });
    }
  }, [isAccountant, navigate]);

  if (isAccountant) {
    return null;
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
            <Route path="/dashboard" element={<ProtectedRoute><PermissionRoute path="/dashboard"><DashboardRoute /></PermissionRoute></ProtectedRoute>} />
            <Route path="/dashboard-example" element={<ProtectedRoute><Layout><DashboardExample /></Layout></ProtectedRoute>} />
            <Route path="/accountant-dashboard" element={<ProtectedRoute><PermissionRoute path="/accountant-dashboard"><Layout><AccountantDashboard /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/dashboard-old" element={<ProtectedRoute><Layout><DashboardOLD /></Layout></ProtectedRoute>} />
            <Route path="/install" element={<Install />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/setup-organization" element={<ProtectedRoute><SetupOrganization /></ProtectedRoute>} />
            
            <Route path="/financial" element={<ProtectedRoute><PermissionRoute path="/financial"><Layout><Financial /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><PermissionRoute path="/schedule"><Layout><Schedule /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><Patients /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patients/new" element={<ProtectedRoute><PermissionRoute path="/patients/new"><Layout><NewPatient /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patients/:id/edit" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><EditPatient /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patients/:patientId/complaint/new" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><ClinicalComplaintForm /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patients/:patientId/complaint/:complaintId/edit" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><ClinicalComplaintForm /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patients/:patientId/sessions/:sessionId/evaluation" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><SessionEvaluationForm /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/sessions/:sessionId/evaluation" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><SessionEvaluationForm /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><PatientDetail /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/patient-old/:id" element={<ProtectedRoute><PermissionRoute path="/patients"><Layout><PatientDetailOLD /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/therapists" element={<ProtectedRoute><PermissionRoute path="/therapists"><Layout><TherapistManagement /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/therapists/:id" element={<ProtectedRoute><PermissionRoute path="/therapists"><Layout><TherapistDetail /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/therapist/:id" element={<ProtectedRoute><PermissionRoute path="/therapists"><Layout><TherapistDetail /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/create-therapist" element={<ProtectedRoute><PermissionRoute path="/create-therapist"><Layout><CreateTherapist /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/team-management" element={<ProtectedRoute><PermissionRoute path="/team-management"><Layout><TeamManagement /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute><PermissionRoute path="/permissions"><Layout><PermissionManagement /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/level-permissions" element={<ProtectedRoute><Layout><LevelPermissionsManagement /></Layout></ProtectedRoute>} />
            <Route path="/migration-wizard" element={<ProtectedRoute><PermissionRoute path="/admin-settings"><Layout><MigrationWizard /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/nfse/config" element={<ProtectedRoute><PermissionRoute path="/nfse/config"><Layout><NFSeConfig /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/nfse/history" element={<ProtectedRoute><PermissionRoute path="/nfse/history"><Layout><NFSeHistory /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/invoice-logs" element={<ProtectedRoute><PermissionRoute path="/invoice-logs"><Layout><InvoiceLogs /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/payment-control" element={<ProtectedRoute><PermissionRoute path="/payment-control"><Layout><PaymentControl /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/admin/security" element={<ProtectedRoute><PermissionRoute path="/admin-settings"><Layout><AdminSettings /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute><PermissionRoute path="/audit-logs"><Layout><AuditLogs /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/admin/incidents" element={<ProtectedRoute><PermissionRoute path="/security-incidents"><Layout><SecurityIncidents /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/admin/log-review" element={<ProtectedRoute><PermissionRoute path="/log-review"><Layout><LogReview /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/admin/permission-review" element={<ProtectedRoute><PermissionRoute path="/permission-review"><Layout><PermissionReview /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/admin/backup-tests" element={<ProtectedRoute><PermissionRoute path="/backup-tests"><Layout><BackupTests /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><PermissionRoute path="/profile-edit"><Layout><ProfileEdit /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute><PermissionRoute path="/whatsapp"><Layout><WhatsAppChat /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/metrics/website" element={<ProtectedRoute><PermissionRoute path="/website-metrics"><Layout><WebsiteMetrics /></Layout></PermissionRoute></ProtectedRoute>} />
            <Route path="/level-permissions" element={<ProtectedRoute><Layout><LevelPermissionsManagement /></Layout></ProtectedRoute>} />
            <Route path="/peer-sharing" element={<ProtectedRoute><Layout><PeerSharingManagement /></Layout></ProtectedRoute>} />
            <Route path="/migration-wizard" element={<ProtectedRoute><Layout><MigrationWizard /></Layout></ProtectedRoute>} />
            <Route path="/organogram" element={<ProtectedRoute><Layout><Organogram /></Layout></ProtectedRoute>} />
            <Route path="/org-management" element={<ProtectedRoute><Layout><OrgManagement /></Layout></ProtectedRoute>} />
            
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
