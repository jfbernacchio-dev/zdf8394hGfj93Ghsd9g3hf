/**
 * ============================================================================
 * DASHBOARD CARDS REGISTRY - TEAM (EQUIPE)
 * ============================================================================
 * 
 * Versões dos cards específicas para dados da equipe (subordinados)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, AlertCircle, Calendar, CheckCircle, XCircle, Clock, Percent } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

// ============================================================================
// CARDS FINANCEIROS - EQUIPE
// ============================================================================

export const DashboardExpectedRevenueTeam = ({ patients, sessions }: any) => {
  const totalExpected = patients.reduce((sum: number, p: any) => {
    const expectedSessions = sessions.filter((s: any) => 
      s.patient_id === p.id && s.status !== 'missed'
    ).length;
    return sum + (expectedSessions * p.session_value);
  }, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Receita Esperada - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Receita esperada total da equipe considerando todas as sessões agendadas (excluindo faltadas)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="text-2xl font-bold">
            {totalExpected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {sessions.filter((s: any) => s.status !== 'missed').length} sessões
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardActualRevenueTeam = ({ sessions }: any) => {
  const actualRevenue = sessions
    .filter((s: any) => s.status === 'attended')
    .reduce((sum: number, s: any) => sum + (s.value || 0), 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Receita Realizada - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Valor total das sessões realizadas pela equipe no período</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <div className="text-2xl font-bold text-green-600">
            {actualRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {sessions.filter((s: any) => s.status === 'attended').length} sessões realizadas
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardUnpaidValueTeam = ({ sessions }: any) => {
  const unpaidValue = sessions
    .filter((s: any) => s.status === 'attended' && !s.paid)
    .reduce((sum: number, s: any) => sum + (s.value || 0), 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Valores a Receber - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Valor total de sessões realizadas pela equipe mas ainda não pagas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <div className="text-2xl font-bold text-orange-600">
            {unpaidValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {sessions.filter((s: any) => s.status === 'attended' && !s.paid).length} sessões pendentes
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardPaymentRateTeam = ({ sessions }: any) => {
  const attended = sessions.filter((s: any) => s.status === 'attended').length;
  const paid = sessions.filter((s: any) => s.paid).length;
  const rate = attended > 0 ? Math.round((paid / attended) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Taxa de Pagamento - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Percentual de sessões realizadas pela equipe que já foram pagas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          <div className="text-2xl font-bold">{rate}%</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {paid} de {attended} sessões pagas
        </p>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CARDS ADMINISTRATIVOS - EQUIPE
// ============================================================================

export const DashboardTotalPatientsTeam = ({ patients }: any) => {
  const activePatients = patients.filter((p: any) => p.status === 'active').length;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Pacientes Ativos - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total de pacientes ativos atendidos pela equipe</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <div className="text-2xl font-bold">{activePatients}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {patients.length} total
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardAttendedSessionsTeam = ({ sessions }: any) => {
  const attendedCount = sessions.filter((s: any) => s.status === 'attended').length;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Sessões Realizadas - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total de sessões que foram realizadas pela equipe no período</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {sessions.length} total
        </p>
      </CardContent>
    </Card>
  );
};
