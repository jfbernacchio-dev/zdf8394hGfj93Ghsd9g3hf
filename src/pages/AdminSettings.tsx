import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MFASetup } from '@/components/MFASetup';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadMFAStatus();
  }, [isAdmin, navigate]);

  const loadMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data?.totp || []);
    } catch (error) {
      console.error('Error loading MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      toast({
        title: 'MFA Desativado',
        description: 'Autenticação de dois fatores foi removida.',
      });

      loadMFAStatus();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-6">
          Configurações de Segurança
        </h1>

        {mfaFactors.length > 0 ? (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">MFA Ativo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A autenticação de dois fatores está ativa em sua conta.
            </p>
            {mfaFactors.map((factor) => (
              <div key={factor.id} className="flex justify-between items-center mb-2">
                <span className="text-sm">{factor.friendly_name || 'MFA Email'}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => disableMFA(factor.id)}
                >
                  Desativar
                </Button>
              </div>
            ))}
          </Card>
        ) : (
          <MFASetup 
            userEmail={user?.email || ''} 
            onSuccess={loadMFAStatus}
          />
        )}
      </div>
  );
};

export default AdminSettings;
