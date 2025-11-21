import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createOrganization, addOwner } from '@/lib/organizations';

/**
 * ============================================================================
 * FASE 10.6: Setup Organization Page
 * ============================================================================
 * 
 * Página para criar primeira empresa ou adicionar nova empresa.
 * Aparece quando usuário não tem organizações vinculadas.
 */

const SetupOrganization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setActiveOrganizationId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    cnpj: '',
    legal_name: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.cnpj || !formData.legal_name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha CNPJ e Razão Social',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[SETUP_ORG] Criando organização:', formData);
      
      // Criar organização
      const org = await createOrganization({
        cnpj: formData.cnpj,
        legal_name: formData.legal_name,
        notes: formData.notes,
        created_by: user.id,
      });

      if (!org) {
        throw new Error('Falha ao criar organização');
      }

      console.log('[SETUP_ORG] Organização criada:', org.id);

      // Adicionar usuário como dono primário
      const ownerAdded = await addOwner(org.id, user.id, true);

      if (!ownerAdded) {
        throw new Error('Falha ao vincular usuário como dono');
      }

      console.log('[SETUP_ORG] Usuário vinculado como dono');

      // Atualizar organizationId ativa
      setActiveOrganizationId(org.id);
      localStorage.setItem('activeOrganizationId', org.id);

      toast({
        title: 'Empresa criada com sucesso',
        description: 'Sua empresa foi configurada e está ativa.',
      });

      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('[SETUP_ORG] Erro:', error);
      toast({
        title: 'Erro ao criar empresa',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 14);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 5) return limited.replace(/^(\d{2})(\d+)/, '$1.$2');
    if (limited.length <= 8) return limited.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (limited.length <= 12) return limited.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return limited.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Configurar Empresa</CardTitle>
          <CardDescription className="text-base">
            Crie sua primeira empresa para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_name">Razão Social *</Label>
              <Input
                id="legal_name"
                placeholder="Nome da empresa"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a empresa"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando empresa...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Criar minha empresa
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupOrganization;
