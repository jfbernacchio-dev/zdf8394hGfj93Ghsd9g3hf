import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ensureLevelRoleSettings, 
  LevelRoleSettingsRow 
} from '@/lib/levelRoleSettingsClient';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  DollarSign,
  Eye,
  MessageSquare,
  Receipt,
  Settings,
  Users,
} from 'lucide-react';

interface LevelPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelId: string;
  levelName: string;
  levelNumber: number;
}

interface LevelRoleSettings {
  can_access_clinical: boolean;
  financial_access: 'none' | 'summary' | 'full';
  can_access_marketing: boolean;
  can_access_whatsapp: boolean;
  clinical_visible_to_superiors: boolean;
  peer_agenda_sharing: boolean;
  peer_clinical_sharing: 'none' | 'view' | 'full';
  uses_org_company_for_nfse: boolean;
  can_edit_schedules: boolean;
  can_view_team_financial_summary: boolean;
  // FASE W3: Permissões de WhatsApp hierárquicas
  can_view_subordinate_whatsapp: boolean;
  can_manage_subordinate_whatsapp: boolean;
  secretary_can_access_whatsapp: boolean;
}

export function LevelPermissionModal({
  open,
  onOpenChange,
  levelId,
  levelName,
  levelNumber,
}: LevelPermissionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  // Estado local (agora carregado do banco)
  const [settings, setSettings] = useState<LevelRoleSettings>({
    can_access_clinical: false,
    financial_access: 'none',
    can_access_marketing: false,
    can_access_whatsapp: false,
    clinical_visible_to_superiors: false,
    peer_agenda_sharing: false,
    peer_clinical_sharing: 'none',
    uses_org_company_for_nfse: false,
    can_edit_schedules: false,
    can_view_team_financial_summary: false,
    // FASE W3: Permissões de WhatsApp hierárquicas
    can_view_subordinate_whatsapp: false,
    can_manage_subordinate_whatsapp: false,
    secretary_can_access_whatsapp: false,
  });

  // FASE 6C-pt3: Mutation para salvar as permissões
  const updateMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      if (!levelId) throw new Error('Missing levelId');

      const { error } = await supabase
        .from('level_role_settings')
        .update({
          can_access_clinical: newSettings.can_access_clinical,
          financial_access: newSettings.financial_access,
          can_access_marketing: newSettings.can_access_marketing,
          can_access_whatsapp: newSettings.can_access_whatsapp,
          clinical_visible_to_superiors: newSettings.clinical_visible_to_superiors,
          peer_agenda_sharing: newSettings.peer_agenda_sharing,
          peer_clinical_sharing: newSettings.peer_clinical_sharing,
          uses_org_company_for_nfse: newSettings.uses_org_company_for_nfse,
          can_edit_schedules: newSettings.can_edit_schedules,
          can_view_team_financial_summary: newSettings.can_view_team_financial_summary,
          // FASE W3: Permissões de WhatsApp hierárquicas
          can_view_subordinate_whatsapp: newSettings.can_view_subordinate_whatsapp,
          can_manage_subordinate_whatsapp: newSettings.can_manage_subordinate_whatsapp,
          secretary_can_access_whatsapp: newSettings.secretary_can_access_whatsapp,
        })
        .eq('level_id', levelId)
        .eq('role_type', 'psychologist');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-levels'] });
      queryClient.invalidateQueries({ queryKey: ['level-role-settings', levelId] });
      toast({
        title: "Permissões atualizadas!",
        description: "As configurações foram salvas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      console.error('[LevelPermissionModal] Save error:', err);
      toast({
        title: "Erro ao salvar permissões",
        description: err?.message || "Ocorreu um erro ao tentar salvar as configurações.",
        variant: "destructive",
      });
    }
  });

  // FASE 6C-pt2: Carregar permissões reais quando o modal abrir
  useEffect(() => {
    if (!open || !levelId) return;

    let active = true;

    const load = async () => {
      try {
        setLoading(true);

        // Carregar ou criar se não existir
        const row = await ensureLevelRoleSettings(levelId, 'psychologist');

        if (!active) return;

        // Preencher estado local do modal com os dados reais
        setSettings({
          can_access_clinical: row.can_access_clinical,
          financial_access: row.financial_access,
          can_access_marketing: row.can_access_marketing,
          can_access_whatsapp: row.can_access_whatsapp,
          clinical_visible_to_superiors: row.clinical_visible_to_superiors,
          peer_agenda_sharing: row.peer_agenda_sharing,
          peer_clinical_sharing: row.peer_clinical_sharing,
          uses_org_company_for_nfse: row.uses_org_company_for_nfse,
          can_edit_schedules: row.can_edit_schedules,
          can_view_team_financial_summary: row.can_view_team_financial_summary,
          // FASE W3: Permissões de WhatsApp hierárquicas
          can_view_subordinate_whatsapp: row.can_view_subordinate_whatsapp,
          can_manage_subordinate_whatsapp: row.can_manage_subordinate_whatsapp,
          secretary_can_access_whatsapp: row.secretary_can_access_whatsapp,
        });
      } catch (err) {
        console.error('[LevelPermissionModal] Failed to load settings:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false };
  }, [open, levelId]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permissões do {levelName}
          </DialogTitle>
          <DialogDescription>
            Configure as permissões para todos os usuários deste nível organizacional.
            <Badge variant="outline" className="ml-2">
              Nível {levelNumber}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Acessos Principais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Acessos Principais</h3>
              </div>

              <div className="space-y-4 pl-6">
                {/* Acesso Clínico */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="clinical">Acesso Clínico</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite visualizar e editar dados clínicos de pacientes
                    </p>
                  </div>
                  <Switch
                    id="clinical"
                    checked={settings.can_access_clinical}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, can_access_clinical: checked })
                    }
                  />
                </div>

                {/* Acesso Marketing */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">Acesso Marketing</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite acessar relatórios e métricas de marketing
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={settings.can_access_marketing}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, can_access_marketing: checked })
                    }
                  />
                </div>

                {/* Acesso WhatsApp */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp">Acesso WhatsApp</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite visualizar e responder mensagens do WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="whatsapp"
                    checked={settings.can_access_whatsapp}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, can_access_whatsapp: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Acesso Financeiro */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Acesso Financeiro</h3>
              </div>

              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="financial">Nível de Acesso</Label>
                  <Select
                    value={settings.financial_access}
                    onValueChange={(value: 'none' | 'summary' | 'full') =>
                      setSettings({ ...settings, financial_access: value })
                    }
                  >
                    <SelectTrigger id="financial">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="summary">Resumo</SelectItem>
                      <SelectItem value="full">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Define se pode ver dados financeiros e com que nível de detalhe
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="team-financial">Ver Resumo Financeiro da Equipe</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite visualizar resumo financeiro consolidado da equipe
                    </p>
                  </div>
                  <Switch
                    id="team-financial"
                    checked={settings.can_view_team_financial_summary}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, can_view_team_financial_summary: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Compartilhamento e Visibilidade */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Compartilhamento e Visibilidade</h3>
              </div>

              <div className="space-y-4 pl-6">
                {/* Visibilidade Clínica para Superiores */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="clinical-visible">
                      Dados Clínicos Visíveis para Superiores
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que níveis superiores vejam dados clínicos deste nível
                    </p>
                  </div>
                  <Switch
                    id="clinical-visible"
                    checked={settings.clinical_visible_to_superiors}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, clinical_visible_to_superiors: checked })
                    }
                  />
                </div>

                {/* Compartilhamento de Agenda entre Pares */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="peer-agenda">Compartilhar Agenda com Pares</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que membros do mesmo nível vejam agendas uns dos outros
                    </p>
                  </div>
                  <Switch
                    id="peer-agenda"
                    checked={settings.peer_agenda_sharing}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, peer_agenda_sharing: checked })
                    }
                  />
                </div>

                {/* Compartilhamento Clínico entre Pares */}
                <div className="space-y-2">
                  <Label htmlFor="peer-clinical">
                    Compartilhamento Clínico entre Pares
                  </Label>
                  <Select
                    value={settings.peer_clinical_sharing}
                    onValueChange={(value: 'none' | 'view' | 'full') =>
                      setSettings({ ...settings, peer_clinical_sharing: value })
                    }
                  >
                    <SelectTrigger id="peer-clinical">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="view">Visualização</SelectItem>
                      <SelectItem value="full">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Define se pares podem ver/editar dados clínicos uns dos outros
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Permissões Administrativas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Permissões Administrativas</h3>
              </div>

              <div className="space-y-4 pl-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-schedules">Editar Agendas</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite editar agendas de outros membros da organização
                    </p>
                  </div>
                  <Switch
                    id="edit-schedules"
                    checked={settings.can_edit_schedules}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, can_edit_schedules: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* FASE W3: Permissões de WhatsApp */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Permissões de WhatsApp</h3>
              </div>

              <div className="space-y-4 pl-6">
                {/* Ver conversas de subordinados */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="view-subordinate-whatsapp">
                      Ver Conversas de Subordinados
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Permite visualizar conversas do WhatsApp de membros subordinados
                    </p>
                  </div>
                  <Switch
                    id="view-subordinate-whatsapp"
                    checked={settings.can_view_subordinate_whatsapp}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, can_view_subordinate_whatsapp: checked })
                    }
                  />
                </div>

                {/* Responder por subordinados */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="manage-subordinate-whatsapp">
                      Responder por Subordinados
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Permite enviar mensagens em nome de subordinados (superior pode responder)
                    </p>
                  </div>
                  <Switch
                    id="manage-subordinate-whatsapp"
                    checked={settings.can_manage_subordinate_whatsapp}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, can_manage_subordinate_whatsapp: checked })
                    }
                  />
                </div>

                {/* Acesso total para secretária */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="secretary-whatsapp">
                      Acesso Total de Secretária
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que assistentes vejam e gerenciem TODAS as conversas da organização
                    </p>
                  </div>
                  <Switch
                    id="secretary-whatsapp"
                    checked={settings.secretary_can_access_whatsapp}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, secretary_can_access_whatsapp: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Configurações de NFSe */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Configurações de NFSe</h3>
              </div>

              <div className="space-y-4 pl-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="org-nfse">Usar Empresa da Organização</Label>
                    <p className="text-xs text-muted-foreground">
                      Emite NFSe em nome da empresa proprietária da organização
                    </p>
                  </div>
                  <Switch
                    id="org-nfse"
                    checked={settings.uses_org_company_for_nfse}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, uses_org_company_for_nfse: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={() => updateMutation.mutate(settings)} 
            disabled={loading || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
