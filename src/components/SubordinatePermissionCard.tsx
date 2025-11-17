import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  Unlock, 
  DollarSign, 
  Users, 
  AlertCircle,
  Save,
  Info
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SubordinatePermission {
  id: string;
  full_name: string;
  crp: string;
  patient_count: number;
  manages_own_patients: boolean;
  has_financial_access: boolean;
  nfse_emission_mode: 'own_company' | 'manager_company';
}

interface SubordinatePermissionCardProps {
  subordinate: SubordinatePermission;
  onUpdate: () => void;
}

export function SubordinatePermissionCard({ 
  subordinate, 
  onUpdate 
}: SubordinatePermissionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [managesOwn, setManagesOwn] = useState(subordinate.manages_own_patients);
  const [hasFinancial, setHasFinancial] = useState(subordinate.has_financial_access);
  const [nfseMode, setNfseMode] = useState(subordinate.nfse_emission_mode);
  const [hasChanges, setHasChanges] = useState(false);

  const handleManagesOwnChange = (checked: boolean) => {
    setManagesOwn(checked);
    // Se desabilitar managesOwn, desabilitar hasFinancial também
    if (!checked && hasFinancial) {
      setHasFinancial(false);
    }
    setHasChanges(true);
  };

  const handleFinancialChange = (checked: boolean) => {
    // hasFinancial só pode ser true se managesOwn for true
    if (checked && !managesOwn) {
      toast.error('Para ter acesso financeiro, precisa primeiro gerenciar próprios pacientes');
      return;
    }
    setHasFinancial(checked);
    setHasChanges(true);
  };

  const handleNfseChange = async (value: 'own_company' | 'manager_company') => {
    // FASE 2: Prevenir mudança para manager_company se tem contador
    if (value === 'manager_company') {
      const { data: hasAccountant } = await supabase
        .from('accountant_therapist_assignments')
        .select('id')
        .eq('therapist_id', subordinate.id)
        .maybeSingle();

      if (hasAccountant) {
        toast.error(
          'Este subordinado possui contador atribuído. Remova o contador antes de mudar para modo "NFSe da Empresa do Gestor".'
        );
        return;
      }
    }

    setNfseMode(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-subordinate-permissions', {
        body: {
          subordinateId: subordinate.id,
          managesOwnPatients: managesOwn,
          hasFinancialAccess: hasFinancial,
          nfseEmissionMode: nfseMode
        }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.code === 'INVALID_PERMISSION_COMBINATION') {
          toast.error(data.error);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast.success('Permissões atualizadas com sucesso');
      setHasChanges(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Erro ao atualizar permissões');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setManagesOwn(subordinate.manages_own_patients);
    setHasFinancial(subordinate.has_financial_access);
    setNfseMode(subordinate.nfse_emission_mode);
    setHasChanges(false);
  };

  // Calculate impact preview
  const getImpactPreview = () => {
    const impacts: string[] = [];
    
    if (managesOwn !== subordinate.manages_own_patients) {
      if (managesOwn) {
        impacts.push('🔒 Verá apenas seus próprios pacientes');
        impacts.push('✅ Poderá ter acesso financeiro próprio');
      } else {
        impacts.push('👁️ Verá todos pacientes da clínica');
        impacts.push('❌ Perderá acesso financeiro (se houver)');
      }
    }

    if (hasFinancial !== subordinate.has_financial_access) {
      if (hasFinancial) {
        impacts.push('💰 Terá próprio fechamento financeiro');
        impacts.push('📊 Não entrará no fechamento do Full');
      } else {
        impacts.push('🔗 Entrará no fechamento do Full');
        impacts.push('📉 Não verá dados financeiros');
      }
    }

    if (nfseMode !== subordinate.nfse_emission_mode) {
      if (nfseMode === 'own_company') {
        impacts.push('🏢 Emitirá NFSe em nome próprio');
      } else {
        impacts.push('🏢 Emitirá NFSe pelo Full');
      }
    }

    return impacts;
  };

  const impacts = getImpactPreview();

  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{subordinate.full_name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>CRP: {subordinate.crp}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {subordinate.patient_count} pacientes
                </span>
              </CardDescription>
            </div>
          </div>
          {managesOwn && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Autônomo
            </Badge>
          )}
          {!managesOwn && (
            <Badge variant="outline" className="gap-1">
              <Unlock className="h-3 w-3" />
              Clínico
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Permissões */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={`manages-own-${subordinate.id}`} className="text-sm font-medium">
                Gerencia Próprios Pacientes
              </Label>
              <p className="text-xs text-muted-foreground">
                Se ativo, verá apenas seus próprios pacientes
              </p>
            </div>
            <Switch
              id={`manages-own-${subordinate.id}`}
              checked={managesOwn}
              onCheckedChange={handleManagesOwnChange}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label 
                htmlFor={`financial-${subordinate.id}`} 
                className="text-sm font-medium flex items-center gap-2"
              >
                Acesso Financeiro
                {!managesOwn && (
                  <Badge variant="secondary" className="text-xs">
                    Requer autonomia
                  </Badge>
                )}
              </Label>
              <p className="text-xs text-muted-foreground">
                Se ativo, terá próprio fechamento financeiro
              </p>
            </div>
            <Switch
              id={`financial-${subordinate.id}`}
              checked={hasFinancial}
              onCheckedChange={handleFinancialChange}
              disabled={isLoading || !managesOwn}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`nfse-${subordinate.id}`} className="text-sm font-medium">
              Emissão de NFSe
            </Label>
            <Select
              value={nfseMode}
              onValueChange={handleNfseChange}
              disabled={isLoading}
            >
              <SelectTrigger id={`nfse-${subordinate.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="own_company">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Empresa Própria
                  </div>
                </SelectItem>
                <SelectItem value="manager_company">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Empresa do Full
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Impact Preview */}
        {impacts.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <p className="font-medium">Impacto das mudanças:</p>
                <ul className="space-y-1 mt-2">
                  {impacts.map((impact, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      {impact}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        {hasChanges && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
            <Button
              onClick={handleReset}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Validation Warning */}
        {hasFinancial && !managesOwn && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Acesso financeiro requer que o terapeuta gerencie próprios pacientes
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}