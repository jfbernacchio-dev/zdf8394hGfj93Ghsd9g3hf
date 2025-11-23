import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BulkDownloadNFSeDialog from '@/components/BulkDownloadNFSeDialog';

import { ArrowLeft, FileText, Download, X, Search, Calendar, DollarSign, RefreshCw, Trash2, RefreshCcw, Mail, Upload, MoreVertical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatBrazilianCurrency, formatBrazilianDate, parseFromBrazilianDate } from '@/lib/brazilianFormat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface NFSeIssued {
  id: string;
  user_id: string;
  patient_id: string;
  patient_name: string;
  patient_cpf: string | null;
  nfse_number: string | null;
  verification_code: string | null;
  issue_date: string;
  service_value: number;
  iss_value: number;
  net_value: number;
  status: 'processing' | 'issued' | 'error' | 'cancelled';
  error_message: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  environment: string;
}

export default function NFSeHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nfseList, setNfseList] = useState<NFSeIssued[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState('producao');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  useEffect(() => {
    loadNFSe();
  }, []);

  const loadNFSe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('[ORG] NFSeHistory - organizationId:', organizationId);

      // 🏢 FILTRO POR ORGANIZAÇÃO
      if (!organizationId) {
        console.warn('[ORG] Sem organizationId - não carregando NFSes');
        setNfseList([]);
        setLoading(false);
        return;
      }

      const { getUserIdsInOrganization } = await import('@/lib/organizationFilters');
      const orgUserIds = await getUserIdsInOrganization(organizationId);

      if (orgUserIds.length === 0) {
        console.warn('[ORG] Nenhum usuário na organização');
        setNfseList([]);
        setLoading(false);
        return;
      }

      // FASE 1: Buscar role do usuário
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!userRole) return;

      const role = userRole.role;
      const isSubordinate = role === 'therapist';
      const isFullOrAdmin = role === 'fulltherapist' || role === 'admin';
      const isAccountant = role === 'accountant';

      // FASE N4: Buscar NFSes por organization_id (com fallback para user_id legado)
      let query = supabase
        .from('nfse_issued')
        .select('*')
        .order('issue_date', { ascending: false });

      // Tentar primeiro por organization_id
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      
      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data as NFSeIssued[] || [];
      let allowedUserIds: string[] = [];

      if (isSubordinate) {
        // SUBORDINADO: Sempre vê apenas suas próprias NFSes
        allowedUserIds = [user.id];
      } else if (isFullOrAdmin) {
        // FULL/ADMIN: Vê suas próprias + subordinados manager_company
        allowedUserIds = [user.id];

        // Buscar subordinados em modo manager_company
        const { data: managerCompanySubordinates } = await supabase
          .from('subordinate_autonomy_settings')
          .select('subordinate_id')
          .eq('manager_id', user.id)
          .eq('nfse_emission_mode', 'manager_company');

        if (managerCompanySubordinates) {
          const subIds = managerCompanySubordinates.map(s => s.subordinate_id);
          // Filtrar apenas subordinados da mesma org
          const subIdsInOrg = subIds.filter(id => orgUserIds.includes(id));
          allowedUserIds.push(...subIdsInOrg);
        }
      } else if (isAccountant) {
        // ACCOUNTANT: Vê terapeutas atribuídos + subordinados manager_company deles
        const { data: assignedTherapists } = await supabase
          .from('accountant_therapist_assignments')
          .select('therapist_id')
          .eq('accountant_id', user.id);

        if (assignedTherapists) {
          const therapistIds = assignedTherapists.map(a => a.therapist_id);
          // Filtrar apenas terapeutas da mesma org
          const therapistIdsInOrg = therapistIds.filter(id => orgUserIds.includes(id));
          allowedUserIds.push(...therapistIdsInOrg);

          // Buscar subordinados manager_company dos terapeutas atribuídos
          const { data: subordinatesOfTherapists } = await supabase
            .from('subordinate_autonomy_settings')
            .select('subordinate_id')
            .in('manager_id', therapistIdsInOrg)
            .eq('nfse_emission_mode', 'manager_company');

          if (subordinatesOfTherapists) {
            const subIds = subordinatesOfTherapists.map(s => s.subordinate_id);
            const subIdsInOrg = subIds.filter(id => orgUserIds.includes(id));
            allowedUserIds.push(...subIdsInOrg);
          }
        }
      }

      // Aplicar filtro
      filteredData = filteredData.filter(nfse => allowedUserIds.includes(nfse.user_id));

      setNfseList(filteredData);
    } catch (error: any) {
      console.error('Error loading NFSe:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (nfseId: string) => {
    try {
      toast({
        title: 'Consultando status',
        description: 'Aguarde enquanto verificamos a situação da nota...',
      });

      const { data, error } = await supabase.functions.invoke('check-nfse-status', {
        body: { nfseId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Status atualizado',
          description: data.message,
        });
        loadNFSe();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
      toast({
        title: 'Erro ao consultar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRefreshAll = async () => {
    const notIssuedNotes = nfseList.filter(
      n => n.environment === activeTab && (n.status === 'processing' || n.status === 'error')
    );

    if (notIssuedNotes.length === 0) {
      toast({
        title: 'Nenhuma nota para atualizar',
        description: 'Todas as notas já estão emitidas ou canceladas.',
      });
      return;
    }

    toast({
      title: 'Atualizando notas',
      description: `Verificando ${notIssuedNotes.length} nota(s)...`,
    });

    let updated = 0;
    for (const note of notIssuedNotes) {
      try {
        const { data } = await supabase.functions.invoke('check-nfse-status', {
          body: { nfseId: note.id },
        });
        if (data?.success) updated++;
      } catch (error) {
        console.error(`Error checking ${note.id}:`, error);
      }
    }

    toast({
      title: 'Atualização concluída',
      description: `${updated} nota(s) atualizada(s) com sucesso.`,
    });
    
    loadNFSe();
  };

  const handleDeleteNFSe = async (nfseId: string) => {
    try {
      const { error } = await supabase
        .from('nfse_issued')
        .delete()
        .eq('id', nfseId);

      if (error) throw error;

      toast({
        title: 'NFSe excluída',
        description: 'A entrada foi removida do histórico.',
      });

      loadNFSe();
    } catch (error: any) {
      console.error('Error deleting NFSe:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async (nfseId: string) => {
    try {
      toast({
        title: 'Enviando NFSe',
        description: 'Aguarde enquanto enviamos por email e WhatsApp...',
      });

      const { data, error } = await supabase.functions.invoke('send-nfse-email', {
        body: { nfseId },
      });

      if (error) throw error;

      if (data.success) {
        const messages = ['Email enviado com sucesso'];
        if (data.whatsappSent) {
          messages.push('WhatsApp enviado com sucesso');
        }
        
        toast({
          title: 'NFSe enviada',
          description: messages.join(' • '),
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error sending NFSe:', error);
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRetryPdfUpload = async (nfseId: string) => {
    try {
      toast({
        title: 'Reenviando PDF',
        description: 'Aguarde enquanto reprocessamos o upload do arquivo...',
      });

      const { data, error } = await supabase.functions.invoke('retry-nfse-pdf-upload', {
        body: { nfseId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'PDF enviado com sucesso',
          description: `Arquivo ${data.fileName} foi adicionado aos arquivos do paciente.`,
        });
        loadNFSe();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error retrying PDF upload:', error);
      toast({
        title: 'Erro ao enviar PDF',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCancelNFSe = async (nfseId: string) => {
    if (!cancelReason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo do cancelamento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Cancelando NFSe',
        description: 'Aguarde enquanto cancelamos a nota fiscal...',
      });

      const { data, error } = await supabase.functions.invoke('cancel-nfse', {
        body: { 
          nfseId,
          cancelReason: cancelReason.trim(),
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'NFSe cancelada',
          description: 'A nota fiscal foi cancelada com sucesso. O PDF agora contém a marca de cancelamento.',
        });
        setCancelReason('');
        loadNFSe();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error cancelling NFSe:', error);
      toast({
        title: 'Erro ao cancelar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      processing: { label: 'Processando', variant: 'secondary' as const },
      issued: { label: 'Emitida', variant: 'default' as const },
      error: { label: 'Erro', variant: 'destructive' as const },
      cancelled: { label: 'Cancelada', variant: 'outline' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.processing;

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getFilteredByPeriod = (list: NFSeIssued[]) => {
    return list.filter(nfse => {
      const issueDate = parseISO(nfse.issue_date);
      const now = new Date();

      switch (periodFilter) {
        case 'thisMonth': {
          const start = startOfMonth(now);
          const end = endOfMonth(now);
          return issueDate >= start && issueDate <= end;
        }
        case 'lastMonth': {
          const lastMonth = subMonths(now, 1);
          const start = startOfMonth(lastMonth);
          const end = endOfMonth(lastMonth);
          return issueDate >= start && issueDate <= end;
        }
        case 'last3Months': {
          const threeMonthsAgo = subMonths(now, 3);
          return issueDate >= threeMonthsAgo;
        }
        case 'thisYear': {
          const start = startOfYear(now);
          return issueDate >= start;
        }
        case 'custom': {
          if (!customStartDate || !customEndDate) return true;
          return issueDate >= customStartDate && issueDate <= customEndDate;
        }
        default:
          return true;
      }
    });
  };

  const filteredNFSe = getFilteredByPeriod(
    nfseList
      .filter(nfse => nfse.environment === activeTab)
      .filter(nfse =>
        nfse.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nfse.patient_cpf?.includes(searchTerm) ||
        nfse.nfse_number?.includes(searchTerm)
      )
  );

  const tabFiltered = getFilteredByPeriod(
    nfseList.filter(n => n.environment === activeTab)
  );

  const totalIssued = tabFiltered.filter(n => n.status === 'issued').length;
  const totalValue = tabFiltered
    .filter(n => n.status === 'issued')
    .reduce((sum, n) => sum + Number(n.service_value), 0);
  
  const thisMonthCount = tabFiltered.filter(n => {
    const issueDate = parseISO(n.issue_date);
    const now = new Date();
    return issueDate.getMonth() === now.getMonth() && 
           issueDate.getFullYear() === now.getFullYear() &&
           n.status === 'issued';
  }).length;

  return (
    <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Histórico de Notas Fiscais</h1>
              <p className="text-muted-foreground">Consulte e gerencie suas NFSe emitidas</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Emitidas</p>
                <p className="text-2xl font-bold">{totalIssued}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatBrazilianCurrency(totalValue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold">{thisMonthCount}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="homologacao">Homologação</TabsTrigger>
              <TabsTrigger value="producao">Produção</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente ou número da nota..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                    <SelectItem value="lastMonth">Mês passado</SelectItem>
                    <SelectItem value="last3Months">Últimos 3 meses</SelectItem>
                    <SelectItem value="thisYear">Este ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {periodFilter === 'custom' && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal", !customStartDate && "text-muted-foreground")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {customStartDate ? formatBrazilianDate(format(customStartDate, 'yyyy-MM-dd')) : "Data inicial"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal", !customEndDate && "text-muted-foreground")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {customEndDate ? formatBrazilianDate(format(customEndDate, 'yyyy-MM-dd')) : "Data final"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
                
                <BulkDownloadNFSeDialog 
                  nfseList={filteredNFSe} 
                  environment={activeTab}
                />
                <Button onClick={handleRefreshAll} variant="outline">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar {filteredNFSe.filter(n => n.status === 'processing' || n.status === 'error').length > 0 
                    ? `(${filteredNFSe.filter(n => n.status === 'processing' || n.status === 'error').length})` 
                    : 'Todas'}
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
              ) : filteredNFSe.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhuma nota encontrada' : `Nenhuma nota fiscal emitida em ${activeTab === 'producao' ? 'produção' : 'homologação'}`}
                </div>
              ) : (
                <>
                  {filteredNFSe.some(n => n.status === 'processing') && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>ℹ️ Notas em processamento:</strong> A prefeitura está processando as notas. 
                        Isso pode levar alguns minutos. Clique em "Atualizar Todas" para verificar o status atualizado.
                      </p>
                    </div>
                  )}
                
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Número NFSe</TableHead>
                  <TableHead>Cód. Verificação</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNFSe.map((nfse) => (
                  <TableRow key={nfse.id}>
                    <TableCell className="font-medium">{nfse.patient_name}</TableCell>
                    <TableCell className="font-mono text-sm">{nfse.patient_cpf || '-'}</TableCell>
                    <TableCell>{nfse.nfse_number || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {nfse.verification_code || '-'}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(nfse.issue_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {formatBrazilianCurrency(Number(nfse.service_value))}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfse.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {(nfse.status === 'processing' || nfse.status === 'error') && (
                            <DropdownMenuItem onClick={() => handleCheckStatus(nfse.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Atualizar status
                            </DropdownMenuItem>
                          )}
                          
                          {nfse.pdf_url && (
                            <DropdownMenuItem onClick={() => window.open(nfse.pdf_url!, '_blank')}>
                              <Download className="h-4 w-4 mr-2" />
                              {nfse.status === 'cancelled' ? 'Baixar PDF (Cancelada)' : 'Baixar PDF'}
                            </DropdownMenuItem>
                          )}
                          
                          {nfse.status === 'issued' && nfse.pdf_url && (
                            <>
                              <DropdownMenuItem onClick={() => handleSendEmail(nfse.id)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar por email e WhatsApp
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleRetryPdfUpload(nfse.id)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Reenviar PDF aos arquivos
                              </DropdownMenuItem>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar nota
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancelar Nota Fiscal?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Informe o motivo do cancelamento:
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <Input
                                    placeholder="Motivo do cancelamento"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                  />
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelNFSe(nfse.id)}>
                                      Cancelar NFSe
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          
                          {(nfse.status === 'error' || nfse.status === 'cancelled' || nfse.status === 'processing') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir do histórico
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir do histórico?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação removerá permanentemente esta entrada do histórico.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteNFSe(nfse.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </>
          )}
            </TabsContent>
          </Tabs>
        </Card>
    </div>
  );
}