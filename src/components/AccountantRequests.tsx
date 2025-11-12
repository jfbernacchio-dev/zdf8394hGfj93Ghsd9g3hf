import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface AccountantRequest {
  id: string;
  therapist_id: string;
  accountant_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  responded_at: string | null;
  therapist_name: string;
}

export const AccountantRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccountantRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar pedidos para este contador
      const { data: requestsData, error: requestsError } = await supabase
        .from('accountant_requests')
        .select('*')
        .eq('accountant_id', user.id)
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Buscar informações dos terapeutas
      const therapistIds = requestsData?.map(r => r.therapist_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', therapistIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      const enrichedRequests: AccountantRequest[] = (requestsData || []).map(request => {
        const therapist = profiles?.find(p => p.id === request.therapist_id);
        return {
          ...request,
          status: request.status as 'pending' | 'approved' | 'rejected',
          therapist_name: therapist?.full_name || 'Desconhecido',
        };
      });

      setRequests(enrichedRequests);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar pedidos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, approve: boolean) => {
    try {
      const newStatus = approve ? 'approved' : 'rejected';
      
      // Atualizar status do request
      const { error: updateError } = await supabase
        .from('accountant_requests')
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // NÃO deletar assignment aqui
      // O terapeuta irá detectar a rejeição via polling e deletar seu próprio assignment
      
      toast({
        title: approve ? 'Pedido aprovado' : 'Pedido rejeitado',
        description: approve 
          ? 'Você agora tem acesso aos dados financeiros deste terapeuta.'
          : 'O pedido foi rejeitado. O terapeuta será notificado.',
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Erro ao processar pedido',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando pedidos...</div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const respondedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pedidos Pendentes ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-accent/10">
                <div className="flex-1">
                  <p className="font-medium">{request.therapist_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Solicitado em {new Date(request.requested_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleRequest(request.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequest(request.id, false)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {respondedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {respondedRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{request.therapist_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Respondido em {request.responded_at ? new Date(request.responded_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum pedido de subordinação recebido.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
