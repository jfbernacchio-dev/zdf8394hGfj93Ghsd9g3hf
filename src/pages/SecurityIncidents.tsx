import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertTriangle, Plus, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  incident_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  affected_data_types: string[] | null;
  affected_users_count: number;
  data_sensitivity: string | null;
  requires_anpd_notification: boolean;
  anpd_notified_at: string | null;
  detected_at: string;
  contained_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

const incidentTypeLabels: Record<string, string> = {
  data_breach: 'Vazamento de Dados',
  unauthorized_access: 'Acesso Não Autorizado',
  system_failure: 'Falha de Sistema',
  malware: 'Malware/Vírus',
  phishing: 'Phishing',
  ddos: 'Ataque DDoS',
  physical_security: 'Segurança Física',
  policy_violation: 'Violação de Política',
  other: 'Outro',
};

const severityLabels: Record<string, { label: string; color: string }> = {
  critical: { label: 'Crítico', color: 'destructive' },
  high: { label: 'Alto', color: 'destructive' },
  medium: { label: 'Médio', color: 'default' },
  low: { label: 'Baixo', color: 'secondary' },
};

const statusLabels: Record<string, string> = {
  reported: 'Reportado',
  investigating: 'Em Investigação',
  contained: 'Contido',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

export default function SecurityIncidents() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: 'other',
    severity: 'medium',
    affected_users_count: 0,
    data_sensitivity: 'internal',
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadIncidents();
  }, [isAdmin, navigate]);

  const loadIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('detected_at', { ascending: false });

      if (error) throw error;
      setIncidents((data || []) as SecurityIncident[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar incidentes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('security_incidents').insert({
        ...formData,
        reported_by: user.id,
        requires_anpd_notification: formData.severity === 'critical',
      });

      if (error) throw error;

      toast({
        title: 'Incidente registrado',
        description: 'O incidente de segurança foi registrado com sucesso.',
      });

      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        incident_type: 'other',
        severity: 'medium',
        affected_users_count: 0,
        data_sensitivity: 'internal',
      });
      loadIncidents();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'contained' && !selectedIncident?.contained_at) {
        updates.contained_at = new Date().toISOString();
      }
      if (status === 'resolved' && !selectedIncident?.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('security_incidents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'O status do incidente foi atualizado.',
      });

      loadIncidents();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const markANPDNotified = async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .update({
          anpd_notified_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'ANPD notificada',
        description: 'A notificação à ANPD foi registrada.',
      });

      loadIncidents();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const generateANPDReport = (incident: SecurityIncident) => {
    const report = `
RELATÓRIO DE INCIDENTE DE SEGURANÇA - ANPD
Data de Geração: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

============================================
IDENTIFICAÇÃO DO INCIDENTE
============================================
Título: ${incident.title}
Tipo: ${incidentTypeLabels[incident.incident_type]}
Gravidade: ${severityLabels[incident.severity].label}
Data de Detecção: ${format(new Date(incident.detected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

============================================
DESCRIÇÃO
============================================
${incident.description}

============================================
DADOS AFETADOS
============================================
Quantidade de Usuários Afetados: ${incident.affected_users_count}
Sensibilidade dos Dados: ${incident.data_sensitivity || 'Não especificado'}
Tipos de Dados: ${incident.affected_data_types?.join(', ') || 'Não especificado'}

============================================
STATUS DO INCIDENTE
============================================
Status Atual: ${statusLabels[incident.status]}
${incident.contained_at ? `Data de Contenção: ${format(new Date(incident.contained_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : 'Ainda não contido'}
${incident.resolved_at ? `Data de Resolução: ${format(new Date(incident.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : 'Ainda não resolvido'}

============================================
RESPONSÁVEL
============================================
Espaço Mindware - Clínica de Psicologia
CNPJ: [Inserir CNPJ]
Contato: [Inserir contato]

Este relatório foi gerado automaticamente pelo sistema de gestão de incidentes.
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-anpd-${incident.id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Relatório gerado',
      description: 'O relatório para ANPD foi baixado.',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestão de Incidentes de Segurança
          </h1>
          <p className="text-muted-foreground">
            Registre, classifique e acompanhe incidentes de segurança da informação
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Incidente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Novo Incidente</DialogTitle>
              <DialogDescription>
                Preencha as informações sobre o incidente de segurança
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Incidente *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Resumo do incidente"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição Detalhada *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o incidente em detalhes"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incident_type">Tipo de Incidente *</Label>
                  <Select
                    value={formData.incident_type}
                    onValueChange={(value) => setFormData({ ...formData, incident_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(incidentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="severity">Gravidade *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(severityLabels).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="affected_users">Usuários Afetados</Label>
                  <Input
                    id="affected_users"
                    type="number"
                    min="0"
                    value={formData.affected_users_count}
                    onChange={(e) => setFormData({ ...formData, affected_users_count: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="data_sensitivity">Sensibilidade dos Dados</Label>
                  <Select
                    value={formData.data_sensitivity}
                    onValueChange={(value) => setFormData({ ...formData, data_sensitivity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="internal">Interno</SelectItem>
                      <SelectItem value="confidential">Confidencial</SelectItem>
                      <SelectItem value="restricted">Restrito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.severity === 'critical' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive">Notificação ANPD Obrigatória</p>
                      <p className="text-sm text-muted-foreground">
                        Incidentes críticos requerem notificação à ANPD conforme LGPD.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                Registrar Incidente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum incidente registrado
            </CardContent>
          </Card>
        ) : (
          incidents.map((incident) => (
            <Card key={incident.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{incident.title}</CardTitle>
                      <Badge variant={severityLabels[incident.severity].color as any}>
                        {severityLabels[incident.severity].label}
                      </Badge>
                    </div>
                    <CardDescription>
                      {incidentTypeLabels[incident.incident_type]} • {' '}
                      Detectado em {format(new Date(incident.detected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{statusLabels[incident.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">
                      {incident.affected_users_count} usuários afetados
                    </Badge>
                    {incident.requires_anpd_notification && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Requer notificação ANPD
                      </Badge>
                    )}
                    {incident.anpd_notified_at && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ANPD notificada em {format(new Date(incident.anpd_notified_at), 'dd/MM/yyyy')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>

                    {incident.requires_anpd_notification && !incident.anpd_notified_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markANPDNotified(incident.id)}
                      >
                        Marcar ANPD Notificada
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateANPDReport(incident)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedIncident && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedIncident.title}
                <Badge variant={severityLabels[selectedIncident.severity].color as any}>
                  {severityLabels[selectedIncident.severity].label}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {incidentTypeLabels[selectedIncident.incident_type]}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Descrição</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Status Atual</Label>
                  <Select
                    value={selectedIncident.status}
                    onValueChange={(value) => updateIncidentStatus(selectedIncident.id, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Usuários Afetados</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedIncident.affected_users_count}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Linha do Tempo</Label>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Detectado:</span>
                    <span>{format(new Date(selectedIncident.detected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                  {selectedIncident.contained_at && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Contido:</span>
                      <span>{format(new Date(selectedIncident.contained_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  )}
                  {selectedIncident.resolved_at && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Resolvido:</span>
                      <span>{format(new Date(selectedIncident.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedIncident.requires_anpd_notification && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-destructive">Notificação ANPD</p>
                      {selectedIncident.anpd_notified_at ? (
                        <p className="text-sm">
                          ANPD notificada em {format(new Date(selectedIncident.anpd_notified_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Este incidente requer notificação à ANPD
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              markANPDNotified(selectedIncident.id);
                              setDetailsOpen(false);
                            }}
                          >
                            Marcar como Notificada
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => generateANPDReport(selectedIncident)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório ANPD
              </Button>
              <Button onClick={() => setDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
