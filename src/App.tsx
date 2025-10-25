import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
            <Route path="/patients/new" element={<ProtectedRoute><NewPatient /></ProtectedRoute>} />
            <Route path="/patients/:id/edit" element={<ProtectedRoute><EditPatient /></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
            <Route path="/therapists" element={<ProtectedRoute><TherapistManagement /></ProtectedRoute>} />
            <Route path="/therapists/:id" element={<ProtectedRoute><TherapistDetail /></ProtectedRoute>} />
            <Route path="/create-therapist" element={<ProtectedRoute><CreateTherapist /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
