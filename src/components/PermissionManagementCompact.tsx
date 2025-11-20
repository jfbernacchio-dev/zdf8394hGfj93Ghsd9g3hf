import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubordinatePermissionCard } from '@/components/SubordinatePermissionCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';
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

export const PermissionManagementCompact = () => {
  const { user } = useAuth();
  const [subordinates, setSubordinates] = useState<SubordinatePermission[]>([]);
  const [selectedSubordinateId, setSelectedSubordinateId] = useState<string>('');
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
      console.error('[PermissionManagementCompact] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSubordinates();
  };

  const selectedSubordinate = subordinates.find(s => s.id === selectedSubordinateId);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Gerenciamento de Permissões
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure as permissões e autonomia dos terapeutas subordinados
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Como funciona o sistema de permissões</AlertTitle>
        <AlertDescription className="mt-2 space-y-1 text-sm">
          <div>
            <strong>Gerencia Próprios Pacientes:</strong> Define se o terapeuta vê apenas seus pacientes ou todos da clínica
          </div>
          <div>
            <strong>Acesso Financeiro:</strong> Permite que o terapeuta tenha próprio fechamento financeiro
          </div>
          <div>
            <strong>Emissão NFSe:</strong> Define se emite notas em nome próprio ou pelo CNPJ do Full
          </div>
        </AlertDescription>
      </Alert>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
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

      {/* Subordinate Selector and Card */}
      {!loading && subordinates.length > 0 && (
        <div className="space-y-4">
          {/* Dropdown para selecionar terapeuta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Selecione o Terapeuta ({subordinates.length})
            </label>
            <Select value={selectedSubordinateId} onValueChange={setSelectedSubordinateId}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Escolha um terapeuta" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                {subordinates.map((subordinate) => (
                  <SelectItem key={subordinate.id} value={subordinate.id} className="cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{subordinate.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-4">
                        CRP: {subordinate.crp} • {subordinate.patient_count} pacientes
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Card do subordinado selecionado */}
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
                Escolha um terapeuta acima para gerenciar suas permissões.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
