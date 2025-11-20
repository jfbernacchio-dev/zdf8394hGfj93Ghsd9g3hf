import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { SubordinatePermissionCard } from '@/components/SubordinatePermissionCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface SubordinatePermission {
  id: string;
  full_name: string;
  crp: string;
  patient_count: number;
  manages_own_patients: boolean;
  has_financial_access: boolean;
  nfse_emission_mode: 'own_company' | 'manager_company';
}

const PermissionManagement = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [subordinates, setSubordinates] = useState<SubordinatePermission[]>([]);
  const [selectedSubordinateId, setSelectedSubordinateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubordinates();
  }, [user]);

  const fetchSubordinates = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get subordinate assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('therapist_assignments')
        .select('subordinate_id')
        .eq('manager_id', user.id);

      if (assignmentsError) throw assignmentsError;

      if (!assignments || assignments.length === 0) {
        setSubordinates([]);
        setLoading(false);
        return;
      }

      const subordinateIds = assignments.map(a => a.subordinate_id);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', subordinateIds);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setSubordinates([]);
        setLoading(false);
        return;
      }

      // Get autonomy settings for all subordinates
      const { data: autonomySettings, error: autonomyError } = await supabase
        .from('subordinate_autonomy_settings')
        .select('*')
        .in('subordinate_id', subordinateIds);

      if (autonomyError) throw autonomyError;

      // Get patient counts
      const { data: patientCounts } = await supabase
        .from('patients')
        .select('user_id')
        .in('user_id', subordinateIds);

      // Build subordinates data
      const subordinatesData: SubordinatePermission[] = profiles.map((profile) => {
        const autonomy = autonomySettings?.find(s => s.subordinate_id === profile.id);
        const patientCount = patientCounts?.filter(p => p.user_id === profile.id).length || 0;

        return {
          id: profile.id,
          full_name: profile.full_name,
          crp: profile.crp || 'N/A',
          patient_count: patientCount,
          manages_own_patients: autonomy?.manages_own_patients || false,
          has_financial_access: autonomy?.has_financial_access || false,
          nfse_emission_mode: (autonomy?.nfse_emission_mode as 'own_company' | 'manager_company') || 'own_company'
        };
      });

      setSubordinates(subordinatesData);
      
      // Auto-select first subordinate if none selected
      if (subordinatesData.length > 0 && !selectedSubordinateId) {
        setSelectedSubordinateId(subordinatesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching subordinates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSubordinates();
  };

  const selectedSubordinate = subordinates.find(s => s.id === selectedSubordinateId);

  // Permissão controlada por PermissionRoute no App.tsx

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/therapist-management')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Equipe
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Gerenciamento de Permissões
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure as permissões e autonomia dos terapeutas subordinados
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Como funciona o sistema de permissões</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-sm">
          <div>
            <strong>Gerencia Próprios Pacientes:</strong> Define se o terapeuta vê apenas seus pacientes (autônomo) ou todos da clínica (clínico)
          </div>
          <div>
            <strong>Acesso Financeiro:</strong> Permite que o terapeuta tenha próprio fechamento financeiro (requer autonomia de pacientes)
          </div>
          <div>
            <strong>Emissão NFSe:</strong> Define se emite notas em nome próprio ou pelo CNPJ do Full
          </div>
        </AlertDescription>
      </Alert>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && subordinates.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum subordinado encontrado</AlertTitle>
          <AlertDescription>
            Você ainda não criou nenhum terapeuta subordinado. Vá para a página de Equipe para criar.
          </AlertDescription>
        </Alert>
      )}

      {/* Subordinates Grid with Sidebar */}
      {!loading && subordinates.length > 0 && (
        <div className="flex gap-6">
          {/* Sidebar - Lista de Subordinados */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-card border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                Terapeutas ({subordinates.length})
              </h2>
              <div className="space-y-1">
                {subordinates.map((subordinate) => (
                  <button
                    key={subordinate.id}
                    onClick={() => setSelectedSubordinateId(subordinate.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSubordinateId === subordinate.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium text-sm">{subordinate.full_name}</div>
                    <div className={`text-xs mt-1 ${
                      selectedSubordinateId === subordinate.id
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    }`}>
                      CRP: {subordinate.crp} • {subordinate.patient_count} pacientes
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Card do Subordinado Selecionado */}
          <div className="flex-1">
            {selectedSubordinate ? (
              <SubordinatePermissionCard
                key={selectedSubordinate.id}
                subordinate={selectedSubordinate}
                onUpdate={fetchSubordinates}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Selecione um terapeuta</AlertTitle>
                <AlertDescription>
                  Escolha um terapeuta da lista ao lado para gerenciar suas permissões.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManagement;