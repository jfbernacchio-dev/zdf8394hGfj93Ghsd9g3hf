import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import EditPatient from "./pages/EditPatient";
import PatientDetail from "./pages/PatientDetail";
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
import AdminSettings from "./pages/AdminSettings";
import Install from "./pages/Install";

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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/install" element={<Install />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><Layout><Patients /></Layout></ProtectedRoute>} />
            <Route path="/patients/new" element={<ProtectedRoute><Layout><NewPatient /></Layout></ProtectedRoute>} />
            <Route path="/patients/:id/edit" element={<ProtectedRoute><Layout><EditPatient /></Layout></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><Layout><PatientDetail /></Layout></ProtectedRoute>} />
            <Route path="/therapists" element={<ProtectedRoute><Layout><TherapistManagement /></Layout></ProtectedRoute>} />
            <Route path="/therapists/:id" element={<ProtectedRoute><Layout><TherapistDetail /></Layout></ProtectedRoute>} />
            <Route path="/create-therapist" element={<ProtectedRoute><Layout><CreateTherapist /></Layout></ProtectedRoute>} />
            <Route path="/nfse/config" element={<ProtectedRoute><Layout><NFSeConfig /></Layout></ProtectedRoute>} />
            <Route path="/nfse/history" element={<ProtectedRoute><Layout><NFSeHistory /></Layout></ProtectedRoute>} />
            <Route path="/invoice-logs" element={<ProtectedRoute><Layout><InvoiceLogs /></Layout></ProtectedRoute>} />
            <Route path="/admin/security" element={<ProtectedRoute><Layout><AdminSettings /></Layout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
